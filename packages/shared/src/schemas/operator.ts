import { z } from 'zod'
import { idSchema, operatorRoleSchema, pinSchema } from './common'

// Limites de campo: o schema valida com eles, o formulário só os mostra.
export const OPERATOR_LIMITS = {
  name: { min: 2, max: 80 },
  pinLength: 4,
} as const

export const OPERATOR_ROLE_LABEL: Record<z.infer<typeof operatorRoleSchema>, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
}

export const operatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  role: operatorRoleSchema,
  active: z.boolean(),
  photoUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
})
export type Operator = z.infer<typeof operatorSchema>

const nameSchema = z
  .string({ required_error: 'Informe o nome completo' })
  .trim()
  .min(OPERATOR_LIMITS.name.min, `O nome precisa ter pelo menos ${OPERATOR_LIMITS.name.min} caracteres`)
  .max(OPERATOR_LIMITS.name.max, `O nome pode ter no máximo ${OPERATOR_LIMITS.name.max} caracteres`)

export const createOperatorSchema = z.object({
  name: nameSchema,
  role: operatorRoleSchema,
  pin: pinSchema,
  photoUrl: z.string().url().nullable().optional(),
})
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>
export type CreateOperatorRequest = z.input<typeof createOperatorSchema>

export const updateOperatorSchema = createOperatorSchema.omit({ pin: true }).partial()
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>
export type UpdateOperatorRequest = z.input<typeof updateOperatorSchema>

export const setPinSchema = z.object({ pin: pinSchema })
export type SetPinInput = z.infer<typeof setPinSchema>

export const setActiveSchema = z.object({ active: z.boolean() })
export type SetActiveInput = z.infer<typeof setActiveSchema>
