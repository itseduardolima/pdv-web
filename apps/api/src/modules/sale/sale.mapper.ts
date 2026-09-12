import type { Prisma } from '@prisma/client'
import type { Sale } from '@pdv/shared'

export type SaleRow = Prisma.SaleGetPayload<{ include: { items: true; operator: { select: { name: true } } } }>
export const saleInclude = { items: true, operator: { select: { name: true } } } as const

// Nunca devolver a linha do Prisma inteira (08-seguranca § 9).
export function toSale(row: SaleRow): Sale {
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
