import { Injectable } from '@nestjs/common'
import type { Product } from '@prisma/client'
import type { CreateSaleInput, Sale } from '@pdv/shared'
import { ConflictError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { CashSessionService } from '../cash-session/cash-session.service'
import { toSale } from './sale.mapper'
import { SaleRepository, StockRaceError, type NewSaleItem } from './sale.repository'

@Injectable()
export class SaleService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashSessions: CashSessionService,
  ) {}

  // 03-regras-negocio § Venda: preço congelado, estoque debitado, nunca
  // negativo, sempre dentro de um caixa aberto. Idempotente por uuid
  // (reenvio da fila offline nunca duplica a venda).
  async create(tenantId: string, operator: OperatorSession, input: CreateSaleInput): Promise<Sale> {
    const existing = await this.sales.findByUuid(tenantId, input.uuid)
    if (existing) return toSale(existing)

    const session = await this.cashSessions.requireOpen(tenantId)

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

    try {
      const row = await this.sales.createWithStockDebit(tenantId, {
        uuid: input.uuid,
        cashSessionId: session.id,
        operatorId: operator.id,
        paymentMethod: input.paymentMethod,
        totalCents,
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
