import { z } from 'zod'
import { idSchema } from './common'

const cents = z.number().int().nonnegative()

export const cashSessionSchema = z.object({
  id: idSchema,
  sequence: z.number().int().positive(),
  openedById: idSchema,
  openedByName: z.string(),
  openingAmountCents: cents,
  note: z.string().nullable(),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  totalCashCents: cents.nullable(),
  totalCardCents: cents.nullable(),
  totalPixCents: cents.nullable(),
})
export type CashSession = z.infer<typeof cashSessionSchema>

// Sessão + totais calculados ao vivo (aberta) ou congelados (fechada).
export const cashSessionSummarySchema = cashSessionSchema.extend({
  totals: z.object({ CASH: cents, CARD: cents, PIX: cents }),
  totalCents: cents,
  salesCount: z.number().int().nonnegative(),
})
export type CashSessionSummary = z.infer<typeof cashSessionSummarySchema>

// GET /cash-sessions/current: envelope porque um JSON `null` solto vira corpo vazio.
export const currentCashSessionSchema = z.object({ session: cashSessionSummarySchema.nullable() })
export type CurrentCashSession = z.infer<typeof currentCashSessionSchema>

export const openCashSessionSchema = z.object({
  openingAmountCents: z
    .number({ invalid_type_error: 'Informe um valor válido', required_error: 'Informe o valor inicial' })
    .int('Informe um valor válido')
    .nonnegative('O valor não pode ser negativo'),
  note: z.string().trim().max(200, 'Observação muito longa').optional(),
})
export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>
