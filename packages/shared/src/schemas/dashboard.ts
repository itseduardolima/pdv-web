import { z } from 'zod'
import { httpUrlSchema, paymentMethodSchema } from './common'

const cents = z.number().int().nonnegative()
// Dia no fuso da loja, "YYYY-MM-DD" — não é um instante, é um rótulo de dia.
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const dashboardDaySchema = z.object({
  date: dayKey,
  totalCents: cents,
  salesCount: z.number().int().nonnegative(),
})
export type DashboardDay = z.infer<typeof dashboardDaySchema>

export const dashboardTopProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  // Foto atual do produto (null se sem foto ou excluído).
  photoUrl: httpUrlSchema().nullable(),
  quantity: z.number().int().positive(),
  totalCents: cents,
})
export type DashboardTopProduct = z.infer<typeof dashboardTopProductSchema>

export const DASHBOARD_WEEK_DAYS = 7
export const DASHBOARD_TOP_PRODUCTS = 5

export const dashboardSummarySchema = z.object({
  // "Hoje" no fuso da loja.
  today: dashboardDaySchema.extend({
    byPaymentMethod: z.record(paymentMethodSchema, cents),
  }),
  topProductsToday: z.array(dashboardTopProductSchema),
  // Últimos 7 dias, do mais antigo ao de hoje, sempre 7 entradas (dia sem venda = 0).
  week: z.array(dashboardDaySchema),
})
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
