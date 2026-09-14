import { Inject, Injectable } from '@nestjs/common'
import { Prisma, type CashSession, type PaymentMethod } from '@prisma/client'
import type { OpenCashSessionInput } from '@pdv/shared'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'
import { saleInclude, type SaleRow } from '../sale/sale.mapper'

export type CashSessionRow = CashSession & { openedBy: { name: string } }
export type PaymentTotals = Record<PaymentMethod, number>

// open() já checa se o caixa está livre antes de criar, mas duas aberturas
// concorrentes do mesmo registerNumber podem passar as duas pelo check —
// o índice único do banco (CashSession_one_open_per_register) rejeita a
// segunda; este erro deixa o Service converter isso num 409 de verdade em
// vez do Prisma estourar um 500 genérico.
export class RegisterAlreadyOpenError extends Error {}

const withOpener = { openedBy: { select: { name: true } } } as const

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

  close(tenantId: string, id: string, totals: PaymentTotals, closedAt: Date): Promise<CashSessionRow> {
    return this.prisma.cashSession.update({
      where: { id, tenantId },
      data: { closedAt, totalCashCents: totals.CASH, totalCardCents: totals.CARD, totalPixCents: totals.PIX },
      include: withOpener,
    })
  }

  async sumSalesByPaymentMethod(
    tenantId: string,
    cashSessionId: string,
  ): Promise<{ totals: PaymentTotals; count: number }> {
    const groups = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { tenantId, cashSessionId },
      _sum: { totalCents: true },
      _count: { _all: true },
    })
    const totals: PaymentTotals = { CASH: 0, CARD: 0, PIX: 0 }
    let count = 0
    for (const group of groups) {
      totals[group.paymentMethod] = group._sum.totalCents ?? 0
      count += group._count._all
    }
    return { totals, count }
  }

  findSales(tenantId: string, cashSessionId: string): Promise<SaleRow[]> {
    return this.prisma.sale.findMany({
      where: { tenantId, cashSessionId },
      include: saleInclude,
      orderBy: { soldAt: 'desc' },
    })
  }
}
