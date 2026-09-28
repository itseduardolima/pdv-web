import { Inject, Injectable } from '@nestjs/common'
import { Prisma, type CashSession, type PaymentMethod } from '@prisma/client'
import type { OpenCashSessionInput } from '@pdv/shared'
import { PRISMA, setTenantInTransaction, type PrismaService, type PrismaTransaction } from '../../prisma/prisma.client'
import { saleInclude, type SaleRow } from '../sale/sale.mapper'

export type CashSessionRow = CashSession & { openedBy: { name: string } }
export type PaymentTotals = Record<PaymentMethod, number>

// open() já checa se o caixa está livre antes de criar, mas duas aberturas
// concorrentes do mesmo registerNumber podem passar as duas pelo check —
// o índice único do banco (CashSession_one_open_per_register) rejeita a
// segunda; este erro deixa o Service converter isso num 409 de verdade em
// vez do Prisma estourar um 500 genérico.
export class RegisterAlreadyOpenError extends Error {}

// Outro fechamento do mesmo caixa venceu a corrida (o lock serializa; o
// segundo não pode sobrescrever closedAt nem os totais congelados).
export class CashSessionAlreadyClosedError extends Error {}

const withOpener = { openedBy: { select: { name: true } } } as const

// Total por forma de pagamento (vendas anuladas não contam) — usado ao vivo
// e dentro da transação de fechamento.
async function sumPayments(
  db: Pick<PrismaTransaction, 'salePayment' | 'sale'>,
  tenantId: string,
  cashSessionId: string,
): Promise<{ totals: PaymentTotals; count: number }> {
  const [groups, count] = await Promise.all([
    db.salePayment.groupBy({
      by: ['method'],
      where: { tenantId, sale: { cashSessionId, voidedAt: null } },
      _sum: { amountCents: true },
    }),
    db.sale.count({ where: { tenantId, cashSessionId, voidedAt: null } }),
  ])
  const totals: PaymentTotals = { CASH: 0, CARD: 0, PIX: 0 }
  for (const group of groups) totals[group.method] = group._sum.amountCents ?? 0
  return { totals, count }
}

@Injectable()
export class CashSessionRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  findOpen(tenantId: string): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({ where: { tenantId, closedAt: null }, include: withOpener })
  }

  // HU 4.7: a sessão "atual" de um operador é a que ELE abriu — não
  // qualquer sessão aberta no tenant (podem existir várias, uma por caixa).
  findOpenByOperator(tenantId: string, openedById: string): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({ where: { tenantId, openedById, closedAt: null }, include: withOpener })
  }

  // HU 4.5: um caixa físico específico pode ter no máximo 1 sessão aberta.
  findOpenByRegister(tenantId: string, registerNumber: number): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({
      where: { tenantId, registerNumber, closedAt: null },
      include: withOpener,
    })
  }

  // HU 4.6: todas as sessões abertas do tenant, pra montar o status de cada caixa.
  findAllOpen(tenantId: string): Promise<CashSessionRow[]> {
    return this.prisma.cashSession.findMany({ where: { tenantId, closedAt: null }, include: withOpener })
  }

  findRegisterCount(tenantId: string): Promise<{ registerCount: number } | null> {
    return this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { registerCount: true } })
  }

  findById(tenantId: string, id: string): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({ where: { tenantId, id }, include: withOpener })
  }

  // "Caixa #N": posição desta sessão entre as sessões do tenant.
  countOpenedUpTo(tenantId: string, openedAt: Date): Promise<number> {
    return this.prisma.cashSession.count({ where: { tenantId, openedAt: { lte: openedAt } } })
  }

  async create(
    tenantId: string,
    openedById: string,
    registerNumber: number,
    input: OpenCashSessionInput,
  ): Promise<CashSessionRow> {
    try {
      return await this.prisma.cashSession.create({
        data: {
          tenantId,
          openedById,
          registerNumber,
          openingAmountCents: input.openingAmountCents,
          note: input.note ?? null,
        },
        include: withOpener,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new RegisterAlreadyOpenError()
      }
      throw error
    }
  }

  // Fechar é atômico: trava a sessão (FOR UPDATE), soma os totais e grava.
  // A anulação de venda trava a mesma linha, então nunca sobra uma venda
  // anulada contada nos totais congelados de um caixa fechado.
  close(tenantId: string, id: string, closedAt: Date): Promise<CashSessionRow> {
    return this.prisma.$transaction(async (tx) => {
      await setTenantInTransaction(tx, tenantId)
      await tx.$queryRaw`SELECT id FROM "CashSession" WHERE id = ${id} FOR UPDATE`
      const { totals } = await sumPayments(tx, tenantId, id)
      const closed = await tx.cashSession.updateMany({
        where: { id, tenantId, closedAt: null },
        data: { closedAt, totalCashCents: totals.CASH, totalCardCents: totals.CARD, totalPixCents: totals.PIX },
      })
      if (closed.count === 0) throw new CashSessionAlreadyClosedError()
      return tx.cashSession.findFirstOrThrow({ where: { id, tenantId }, include: withOpener })
    })
  }

  sumSalesByPaymentMethod(tenantId: string, cashSessionId: string): Promise<{ totals: PaymentTotals; count: number }> {
    return sumPayments(this.prisma, tenantId, cashSessionId)
  }

  findSales(tenantId: string, cashSessionId: string): Promise<SaleRow[]> {
    return this.prisma.sale.findMany({
      where: { tenantId, cashSessionId },
      include: saleInclude,
      orderBy: { soldAt: 'desc' },
    })
  }
}
