import { z } from 'zod'
import { idSchema, paymentMethodSchema } from './common'

const cents = z.number().int().nonnegative()

export const saleItemInputSchema = z.object({
  productId: idSchema,
  quantity: z
    .number({ invalid_type_error: 'Quantidade inválida' })
    .int('Quantidade inválida')
    .positive('A quantidade deve ser maior que zero'),
})

export const createSaleSchema = z.object({
  uuid: z.string().uuid('Identificador da venda inválido'),
  items: z.array(saleItemInputSchema).min(1, 'Adicione ao menos um item ao carrinho'),
  paymentMethod: paymentMethodSchema,
  soldAt: z.string().datetime().optional(),
})
export type CreateSaleInput = z.infer<typeof createSaleSchema>

export const syncSalesSchema = z.object({
  sales: z.array(createSaleSchema).min(1).max(200),
})
export type SyncSalesInput = z.infer<typeof syncSalesSchema>

export const saleItemSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: cents,
})

export const saleSchema = z.object({
  id: idSchema,
  uuid: z.string().uuid(),
  cashSessionId: idSchema,
  operatorId: idSchema,
  operatorName: z.string(),
  paymentMethod: paymentMethodSchema,
  totalCents: cents,
  soldAt: z.string().datetime(),
  items: z.array(saleItemSchema),
})
export type Sale = z.infer<typeof saleSchema>

export const dashboardSummarySchema = z.object({
  todayTotalCents: cents,
  byPaymentMethod: z.object({ CASH: cents, CARD: cents, PIX: cents }),
  topProductsToday: z.array(
    z.object({
      productId: idSchema,
      name: z.string(),
      photoUrl: z.string().url().nullable(),
      quantity: z.number().int().nonnegative(),
    }),
  ),
  week: z.array(z.object({ day: z.string(), totalCents: cents })),
})
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
