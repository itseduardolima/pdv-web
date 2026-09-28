import type { Prisma } from '@prisma/client'
import type { Sale } from '@pdv/shared'

export type SaleRow = Prisma.SaleGetPayload<{
  include: {
    items: true
    payments: true
    operator: { select: { name: true } }
    cashSession: { select: { closedAt: true } }
  }
}>
export const saleInclude = {
  items: true,
  payments: true,
  operator: { select: { name: true } },
  cashSession: { select: { closedAt: true } },
} as const

// Nunca devolver a linha do Prisma inteira (08-seguranca § 9).
export function toSale(row: SaleRow): Sale {
  return {
    id: row.id,
    uuid: row.uuid,
    cashSessionId: row.cashSessionId,
    operatorId: row.operatorId,
    operatorName: row.operator.name,
    paymentMethod: row.paymentMethod,
    payments: row.payments.map((payment) => ({ method: payment.method, amountCents: payment.amountCents })),
    totalCents: row.totalCents,
    amountReceivedCents: row.amountReceivedCents,
    changeCents: row.changeCents,
    soldAt: row.soldAt.toISOString(),
    voidable: isVoidable(row),
    voidedAt: row.voidedAt?.toISOString() ?? null,
    voidReason: row.voidReason,
    items: row.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  }
}

// Regra única de "pode anular" (03-regras-negocio § Venda), usada pelo mapper e pelo Service.
export function isVoidable(row: Pick<SaleRow, 'voidedAt' | 'cashSession'>): boolean {
  return row.voidedAt === null && row.cashSession.closedAt === null
}
