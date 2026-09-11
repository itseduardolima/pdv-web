import { z } from 'zod'
import { idSchema } from './common'

const cents = z.number().int().nonnegative()

export const cashSessionSchema = z.object({
  id: idSchema,
  openedById: idSchema,
  openingAmountCents: cents,
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  totalCashCents: cents.nullable(),
  totalCardCents: cents.nullable(),
  totalPixCents: cents.nullable(),
})
export type CashSession = z.infer<typeof cashSessionSchema>

export const openCashSessionSchema = z.object({
  openingAmountCents: cents,
  note: z.string().trim().max(200).optional(),
})
export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>
