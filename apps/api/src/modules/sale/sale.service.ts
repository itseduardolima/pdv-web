import { Injectable } from '@nestjs/common'
import type { Product } from '@prisma/client'
import type {
  CreateSaleInput,
  Sale,
  SalesHistoryQuery,
  SyncSaleResult,
  SyncSalesInput,
  SyncSalesResult,
} from '@pdv/shared'
import { addDaysToDayKey, dayKeyInTimeZone, isValidTimeZone, startOfDayInTimeZone } from '../../common/utils/time-zone'
import { ConflictError, DomainError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { CashSessionService } from '../cash-session/cash-session.service'
import { TenantService } from '../tenant/tenant.service'
import { toSale } from './sale.mapper'
import { SaleRepository, StockRaceError, type NewSaleItem, type NewSalePayment } from './sale.repository'

const FALLBACK_TIME_ZONE = 'UTC'

@Injectable()
export class SaleService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashSessions: CashSessionService,
    private readonly tenants: TenantService,
  ) {}

  // 03-regras-negocio § Venda: preço congelado, estoque debitado, nunca
  // negativo, sempre dentro de um caixa aberto. Idempotente por uuid
  // (reenvio da fila offline nunca duplica a venda).
  async create(tenantId: string, operator: OperatorSession, input: CreateSaleInput): Promise<Sale> {
    const existing = await this.sales.findByUuid(tenantId, input.uuid)
    if (existing) return toSale(existing)

    const session = await this.cashSessions.requireOpen(tenantId, operator.id)

    const requested = mergeItems(input.items)
    const products = await this.sales.findProducts(
      tenantId,
      requested.map((item) => item.productId),
    )
    const byId = new Map(products.map((product) => [product.id, product]))

    const items: NewSaleItem[] = requested.map((item) => {
      const product = byId.get(item.productId)
      if (!product) {
        throw new NotFoundError('PRODUCT_NOT_FOUND', 'Um dos produtos do carrinho não existe mais.', {
          productId: item.productId,
        })
      }
      assertStock(product, item.quantity)
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.salePriceCents,
      }
    })

    const totalCents = items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0)
    const payments = splitPayments(input, totalCents)
    const change = computeChange(payments, input.amountReceivedCents)

    try {
      const row = await this.sales.createWithStockDebit(tenantId, {
        uuid: input.uuid,
        cashSessionId: session.id,
        operatorId: operator.id,
        paymentMethod: input.paymentMethod,
        payments,
        totalCents,
        amountReceivedCents: change.amountReceivedCents,
        changeCents: change.changeCents,
        soldAt: input.soldAt ? new Date(input.soldAt) : new Date(),
        items,
      })
      return toSale(row)
    } catch (error) {
      // Outra venda levou o estoque entre a checagem e a transação.
      if (error instanceof StockRaceError) {
        const product = byId.get(error.productId)
        throw insufficientStock(product?.name ?? 'produto', error.productId, null)
      }
      throw error
    }
  }

  // HU 8.2 (fila offline): processa em ordem — cada venda já é idempotente
  // por uuid (create()), então reenviar o mesmo lote nunca duplica nada.
  // Uma venda com erro de regra (ex.: sem estoque quando enfim sincronizou)
  // não derruba as outras: cada item do lote tem seu próprio resultado.
  async syncBatch(tenantId: string, operator: OperatorSession, input: SyncSalesInput): Promise<SyncSalesResult> {
    const results: SyncSaleResult[] = []
    for (const saleInput of input.sales) {
      try {
        const sale = await this.create(tenantId, operator, saleInput)
        results.push({ uuid: saleInput.uuid, ok: true, sale })
      } catch (error) {
        if (!(error instanceof DomainError)) throw error
        results.push({
          uuid: saleInput.uuid,
          ok: false,
          error: {
            statusCode: error.statusCode,
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        })
      }
    }
    return { results }
  }

  // Tela Histórico de Vendas: sempre um dia de calendário no fuso da loja —
  // "today"/"yesterday" resolvidos a partir de `now`, "day" usa a data que
  // o usuário escolheu direto.
  async history(tenantId: string, query: SalesHistoryQuery, now: Date = new Date()): Promise<Sale[]> {
    const timeZone = await this.resolveTimeZone(tenantId)
    const today = dayKeyInTimeZone(now, timeZone)
    const dayKey =
      query.period === 'today' ? today : query.period === 'yesterday' ? addDaysToDayKey(today, -1) : query.date!

    const from = startOfDayInTimeZone(dayKey, timeZone)
    const to = startOfDayInTimeZone(addDaysToDayKey(dayKey, 1), timeZone)
    const rows = await this.sales.findHistory(tenantId, from, to, query.search)
    return rows.map(toSale)
  }

  private async resolveTimeZone(tenantId: string): Promise<string> {
    const tenant = await this.tenants.getCurrent(tenantId)
    return isValidTimeZone(tenant.timezone) ? tenant.timezone : FALLBACK_TIME_ZONE
  }
}

// Pagamento misto (03-regras-negocio § Venda): `partialPayment` paga uma
// parte com valor explícito e `paymentMethod` paga o resto. Máx. 2 formas
// (podem repetir, ex.: 2 cartões) e a parte explícita precisa deixar resto > 0.
function splitPayments(input: CreateSaleInput, totalCents: number): NewSalePayment[] {
  const partial = input.partialPayment
  if (!partial) return [{ method: input.paymentMethod, amountCents: totalCents }]
  if (partial.amountCents >= totalCents) {
    throw new DomainError(
      'PARTIAL_PAYMENT_TOO_HIGH',
      'O valor da primeira forma de pagamento deve ser menor que o total da venda.',
      400,
      { totalCents, amountCents: partial.amountCents },
    )
  }
  return [partial, { method: input.paymentMethod, amountCents: totalCents - partial.amountCents }]
}

// Troco (03-regras-negocio § Venda): só sobre a parte em Dinheiro e só se o
// operador informou quanto recebeu. Calculado aqui, nunca aceito pronto do
// cliente; recebido menor que a parte em Dinheiro é recusado. Sem Dinheiro
// na venda o valor é ignorado.
function computeChange(
  payments: NewSalePayment[],
  amountReceivedCents: number | undefined,
): { amountReceivedCents: number | null; changeCents: number | null } {
  const cashCents = payments.reduce((sum, payment) => sum + (payment.method === 'CASH' ? payment.amountCents : 0), 0)
  if (cashCents === 0 || amountReceivedCents === undefined) return { amountReceivedCents: null, changeCents: null }
  if (amountReceivedCents < cashCents) {
    const message =
      payments.length === 1
        ? 'Valor recebido menor que o total da venda.'
        : 'Valor recebido menor que o valor em Dinheiro.'
    throw new DomainError('INSUFFICIENT_CASH', message, 400, {
      totalCents: cashCents,
      amountReceivedCents,
    })
  }
  return { amountReceivedCents, changeCents: amountReceivedCents - cashCents }
}

// Mesmo produto em duas linhas vira uma só (a checagem de estoque é por produto).
function mergeItems(items: CreateSaleInput['items']): CreateSaleInput['items'] {
  const merged = new Map<string, number>()
  for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }))
}

function assertStock(product: Product, quantity: number): void {
  if (quantity > product.stockQuantity) throw insufficientStock(product.name, product.id, product.stockQuantity)
}

function insufficientStock(name: string, productId: string, available: number | null): ConflictError {
  const message =
    available === null
      ? `Estoque insuficiente de "${name}". Confira a quantidade e tente de novo.`
      : available === 0
        ? `"${name}" está sem estoque.`
        : `Estoque insuficiente: só há ${available} ${available === 1 ? 'unidade' : 'unidades'} de "${name}".`
  return new ConflictError('INSUFFICIENT_STOCK', message, { productId, available })
}
