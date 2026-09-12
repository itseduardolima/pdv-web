import { Injectable } from '@nestjs/common'
import { Prisma, type CashSession, type PaymentMethod } from '@prisma/client'
import type { OpenCashSessionInput } from '@pdv/shared'
import { PrismaService } from '../../prisma/prisma.service'

export type CashSessionRow = CashSession & { openedBy: { name: string } }
export type SaleRow = Prisma.SaleGetPayload<{ include: { items: true; operator: { select: { name: true } } } }>
export type PaymentTotals = Record<PaymentMethod, number>

const withOpener = { openedBy: { select: { name: true } } } as const

@Injectable()
export class CashSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpen(tenantId: string): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({ where: { tenantId, closedAt: null }, include: withOpener })
  }

  findById(tenantId: string, id: string): Promise<CashSessionRow | null> {
    return this.prisma.cashSession.findFirst({ where: { tenantId, id }, include: withOpener })
  }

  // "Caixa #N": posição desta sessão entre as sessões do tenant.
  countOpenedUpTo(tenantId: string, openedAt: Date): Promise<number> {
    return this.prisma.cashSession.count({ where: { tenantId, openedAt: { lte: openedAt } } })
  }

  create(tenantId: string, openedById: string, input: OpenCashSessionInput): Promise<CashSessionRow> {
    return this.prisma.cashSession.create({
      data: { tenantId, openedById, openingAmountCents: input.openingAmountCents, note: input.note ?? null },
      include: withOpener,
    })
  }

  close(tenantId: string, id: string, totals: PaymentTotals, closedAt: Date): Promise<CashSessionRow> {
    return this.prisma.cashSession.update({
      where: { id, tenantId },
      data: { closedAt, totalCashCents: totals.CASH, totalCardCents: totals.CARD, totalPixCents: totals.PIX },
      include: withOpener,
    })
  }

  async sumSalesByPaymentMethod(tenantId: string, cashSessionId: string): Promise<{ totals: PaymentTotals; count: number }> {
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
      include: { items: true, operator: { select: { name: true } } },
      orderBy: { soldAt: 'desc' },
    })
  }
}
