import { z } from 'zod'
import { idSchema, operatorRoleSchema, pinSchema } from './common'

export const loginOperatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  photoUrl: z.string().url().nullable(),
})
export type LoginOperator = z.infer<typeof loginOperatorSchema>

export const loginInputSchema = z.object({
  operatorId: z.string().min(1, 'Selecione quem está no caixa'),
  pin: pinSchema,
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const currentSessionSchema = z.object({
  operator: z.object({
    id: idSchema,
    name: z.string(),
    role: operatorRoleSchema,
    photoUrl: z.string().url().nullable(),
  }),
  tenantId: idSchema,
})
export type CurrentSession = z.infer<typeof currentSessionSchema>
