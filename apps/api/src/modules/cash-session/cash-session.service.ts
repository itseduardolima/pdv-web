import { Injectable } from '@nestjs/common'
import type { CashSessionRegister, CashSessionSummary, OpenCashSessionInput, Sale } from '@pdv/shared'
import { ConflictError, DomainError, ForbiddenError, NotFoundError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { toSale } from '../sale/sale.mapper'
import {
  CashSessionRepository,
  RegisterAlreadyOpenError,
  type CashSessionRow,
  type PaymentTotals,
} from './cash-session.repository'

const sessionNotFound = () => new NotFoundError('CASH_SESSION_NOT_FOUND', 'Caixa não encontrado.')
// Mesmo formato do 400 VALIDATION do pipe, para cair embaixo do campo na tela.
const invalidRegister = () =>
  new DomainError('VALIDATION', 'Dados inválidos.', 400, {
    formErrors: [],
    fieldErrors: { registerNumber: ['Caixa inválido.'] },
  })
const registerAlreadyOpen = (registerNumber: number) =>
  new ConflictError('CASH_SESSION_ALREADY_OPEN', `O Caixa ${registerNumber} já está aberto.`, { registerNumber })

// Operador só vê/mexe no próprio caixa; Administrador vê/mexe em qualquer um
// do tenant (03-regras-negocio § Papéis: "Ver Fechamento de qualquer sessão
// de caixa" é privilégio de Administrador — Operador só o próprio).
function assertCanAccess(row: CashSessionRow, operator: OperatorSession, action: string): void {
  if (operator.role !== 'ADMIN' && row.openedById !== operator.id) {
    throw new ForbiddenError('NOT_CASH_SESSION_OWNER', `Só quem abriu o caixa (ou um Administrador) pode ${action}.`)
  }
}

@Injectable()
export class CashSessionService {
  constructor(private readonly sessions: CashSessionRepository) {}

  // "A loja está operando hoje": existe QUALQUER sessão aberta no tenant —
  // não importa quem abriu. Usado só pra decidir acesso a Vender/Produtos/
  // Fechamento/Dashboard/Operadores (HU 4.2); nunca pra saber "meu" caixa.
  async getCurrent(tenantId: string): Promise<CashSessionSummary | null> {
    const row = await this.sessions.findOpen(tenantId)
    return row ? this.toSummary(tenantId, row) : null
  }

  // HU 4.7: "meu" caixa é a sessão que ESTE operador abriu — com múltiplos
  // caixas, cada operador só enxerga (e vende contra) o seu próprio.
  async getMine(tenantId: string, operatorId: string): Promise<CashSessionSummary | null> {
    const row = await this.sessions.findOpenByOperator(tenantId, operatorId)
    return row ? this.toSummary(tenantId, row) : null
  }

  // Vender exige caixa aberto (03-regras-negocio § Caixa) — e é sempre o
  // caixa que o próprio operador abriu, nunca o de outro operador.
  async requireOpen(tenantId: string, operatorId: string): Promise<CashSessionRow> {
    const row = await this.sessions.findOpenByOperator(tenantId, operatorId)
    if (!row) throw new ConflictError('CASH_SESSION_NOT_OPEN', 'Abra o caixa antes de vender.')
    return row
  }

  // HU 4.6: status de cada caixa físico (livre, ou aberto por quem/desde quando).
  async listRegisters(tenantId: string): Promise<CashSessionRegister[]> {
    const tenant = await this.sessions.findRegisterCount(tenantId)
    const registerCount = tenant?.registerCount ?? 1
    const open = await this.sessions.findAllOpen(tenantId)
    const byRegister = new Map(open.map((row) => [row.registerNumber, row]))
    return Array.from({ length: registerCount }, (_, index) => {
      const registerNumber = index + 1
      const row = byRegister.get(registerNumber)
      return {
        registerNumber,
        sessionId: row?.id ?? null,
        openedById: row?.openedById ?? null,
        openedByName: row?.openedBy.name ?? null,
        openedAt: row?.openedAt.toISOString() ?? null,
      }
    })
  }

  async get(tenantId: string, id: string, operator: OperatorSession): Promise<CashSessionSummary> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    assertCanAccess(row, operator, 'ver')
    return this.toSummary(tenantId, row)
  }

  // 03-regras-negocio § Caixa: até tenant.registerCount sessões abertas ao
  // mesmo tempo no tenant, uma por caixa físico (HU 4.5). registerCount = 1
  // (default) mantém exatamente 1 sessão aberta por tenant, como na v1.
  async open(tenantId: string, operator: OperatorSession, input: OpenCashSessionInput): Promise<CashSessionSummary> {
    const registerNumber = input.registerNumber ?? 1
    const tenant = await this.sessions.findRegisterCount(tenantId)
    if (!tenant || registerNumber < 1 || registerNumber > tenant.registerCount) throw invalidRegister()
    const open = await this.sessions.findOpenByRegister(tenantId, registerNumber)
    if (open) throw registerAlreadyOpen(registerNumber)
    try {
      const row = await this.sessions.create(tenantId, operator.id, registerNumber, input)
      return this.toSummary(tenantId, row)
    } catch (error) {
      // Duas aberturas do mesmo caixa passaram pelo check acima ao mesmo
      // tempo — o índice único do banco pegou a segunda; vira 409 normal,
      // não um 500 genérico.
      if (error instanceof RegisterAlreadyOpenError) throw registerAlreadyOpen(registerNumber)
      throw error
    }
  }

  // Operador fecha só o próprio caixa; Administrador fecha qualquer um.
  // Fechada, a sessão congela os totais e não aceita mais vendas.
  async close(tenantId: string, id: string, operator: OperatorSession): Promise<CashSessionSummary> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    if (row.closedAt) throw new ConflictError('CASH_SESSION_ALREADY_CLOSED', 'Este caixa já foi fechado.')
    assertCanAccess(row, operator, 'fechá-lo')
    const { totals } = await this.sessions.sumSalesByPaymentMethod(tenantId, id)
    const closed = await this.sessions.close(tenantId, id, totals, new Date())
    return this.toSummary(tenantId, closed)
  }

  async listSales(tenantId: string, id: string, operator: OperatorSession): Promise<Sale[]> {
    const row = await this.sessions.findById(tenantId, id)
    if (!row) throw sessionNotFound()
    assertCanAccess(row, operator, 'ver o histórico de vendas')
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
      registerNumber: row.registerNumber,
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
