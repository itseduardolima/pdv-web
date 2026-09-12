import { Injectable } from '@nestjs/common'
import type { CashSessionSummary, OpenCashSessionInput, Sale } from '@pdv/shared'
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { CashSessionRepository, type CashSessionRow, type PaymentTotals, type SaleRow } from './cash-session.repository'

const sessionNotFound = () => new NotFoundError('CASH_SESSION_NOT_FOUND', 'Caixa não encontrado.')

@Injectable()
export class CashSessionService {
  constructor(private readonly sessions: CashSessionRepository) {}

  async getCurrent(tenantId: string): Promise<CashSessionSummary | null> {
    const row = await this.sessions.findOpen(tenantId)
    return row ? this.toSummary(tenantId, row) : null
  }

  async get(tenantId: string, id: string): Promise<CashSessionSummary> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    return this.toSummary(tenantId, row)
  }

  // 03-regras-negocio § Caixa: uma sessão aberta por tenant.
  async open(tenantId: string, operator: OperatorSession, input: OpenCashSessionInput): Promise<CashSessionSummary> {
    const open = await this.sessions.findOpen(tenantId)
    if (open) throw new ConflictError('CASH_SESSION_ALREADY_OPEN', 'Já existe um caixa aberto.')
    const row = await this.sessions.create(tenantId, operator.id, input)
    return this.toSummary(tenantId, row)
  }

  // Operador fecha só o próprio caixa; Administrador fecha qualquer um.
  // Fechada, a sessão congela os totais e não aceita mais vendas.
  async close(tenantId: string, id: string, operator: OperatorSession): Promise<CashSessionSummary> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    if (row.closedAt) throw new ConflictError('CASH_SESSION_ALREADY_CLOSED', 'Este caixa já foi fechado.')
    if (operator.role !== 'ADMIN' && row.openedById !== operator.id) {
      throw new ForbiddenError('NOT_CASH_SESSION_OWNER', 'Só quem abriu o caixa (ou um Administrador) pode fechá-lo.')
    }
    const { totals } = await this.sessions.sumSalesByPaymentMethod(tenantId, id)
    const closed = await this.sessions.close(tenantId, id, totals, new Date())
    return this.toSummary(tenantId, closed)
  }

  async listSales(tenantId: string, id: string): Promise<Sale[]> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    const rows = await this.sessions.findSales(tenantId, id)
    return rows.map(toSale)
  }

  private async toSummary(tenantId: string, row: CashSessionRow): Promise<CashSessionSummary> {
    const [sequence, live] = await Promise.all([
      this.sessions.countOpenedUpTo(tenantId, row.openedAt),
      this.sessions.sumSalesByPaymentMethod(tenantId, row.id),
    ])
    // Fechada: totais congelados no fechamento; aberta: calculados agora.
    const totals: PaymentTotals = row.closedAt
      ? { CASH: row.totalCashCents ?? 0, CARD: row.totalCardCents ?? 0, PIX: row.totalPixCents ?? 0 }
      : live.totals
    return {
      id: row.id,
      sequence,
      openedById: row.openedById,
      openedByName: row.openedBy.name,
      openingAmountCents: row.openingAmountCents,
      note: row.note,
      openedAt: row.openedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
      totalCashCents: row.totalCashCents,
      totalCardCents: row.totalCardCents,
      totalPixCents: row.totalPixCents,
      totals,
      totalCents: totals.CASH + totals.CARD + totals.PIX,
      salesCount: live.count,
    }
  }
}

function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    uuid: row.uuid,
    cashSessionId: row.cashSessionId,
    operatorId: row.operatorId,
    operatorName: row.operator.name,
    paymentMethod: row.paymentMethod,
    totalCents: row.totalCents,
    soldAt: row.soldAt.toISOString(),
    items: row.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  }
}
