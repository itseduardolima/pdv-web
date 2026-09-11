import { z } from 'zod'
import { idSchema, operatorRoleSchema, pinSchema } from './common'

export const operatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  role: operatorRoleSchema,
  active: z.boolean(),
  photoUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
})
export type Operator = z.infer<typeof operatorSchema>

export const createOperatorSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo').max(80),
  role: operatorRoleSchema,
  pin: pinSchema,
  photoUrl: z.string().url().nullable().optional(),
})
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>

export const updateOperatorSchema = createOperatorSchema.omit({ pin: true }).partial()
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>

export const setPinSchema = z.object({ pin: pinSchema })
export type SetPinInput = z.infer<typeof setPinSchema>

export const setActiveSchema = z.object({ active: z.boolean() })
export type SetActiveInput = z.infer<typeof setActiveSchema>
