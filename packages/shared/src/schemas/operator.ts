import { z } from 'zod'
import { emailSchema, httpUrlSchema, idSchema, operatorRoleSchema, pinSchema } from './common'

// Limites de campo: o schema valida com eles, o formulário só os mostra.
export const OPERATOR_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 160 },
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
  email: z.string().nullable(),
  // false = primeiro acesso pendente (ainda não definiu o PIN pelo link).
  hasPin: z.boolean(),
  active: z.boolean(),
  photoUrl: httpUrlSchema().nullable(),
  createdAt: z.string().datetime(),
})
export type Operator = z.infer<typeof operatorSchema>

// Só letras (com acento) e espaço — sem número nem símbolo. Diferente de
// Produto (código/quantidade no nome são normais); nome de pessoa não tem
// por quê.
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/
const NAME_PATTERN_MESSAGE = 'O nome só pode ter letras (acentos valem) e espaço, sem número ou símbolo'

const nameSchema = z
  .string({ required_error: 'Informe o nome completo' })
  .trim()
  .min(OPERATOR_LIMITS.name.min, `O nome precisa ter pelo menos ${OPERATOR_LIMITS.name.min} caracteres`)
  .max(OPERATOR_LIMITS.name.max, `O nome pode ter no máximo ${OPERATOR_LIMITS.name.max} caracteres`)
  .regex(NAME_PATTERN, NAME_PATTERN_MESSAGE)

// "" vira null: campo opcional deixado em branco no formulário.
const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  emailSchema.nullable().optional(),
)

export const ADMIN_EMAIL_REQUIRED_MESSAGE = 'Administrador precisa de e-mail para recuperar o PIN'
export const PIN_OR_EMAIL_REQUIRED_MESSAGE = 'Informe um PIN inicial ou um e-mail para o primeiro acesso'

// Regras (03-regras-negocio § Operadores): Administrador sempre tem e-mail;
// sem e-mail é obrigatório dar um PIN inicial (não há como o operador
// definir o próprio PIN).
export const createOperatorSchema = z
  .object({
    name: nameSchema,
    role: operatorRoleSchema,
    email: optionalEmailSchema,
    pin: z.preprocess((value) => (value === '' ? undefined : value), pinSchema.optional()),
    photoUrl: httpUrlSchema().nullable().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.role === 'ADMIN' && !input.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: ADMIN_EMAIL_REQUIRED_MESSAGE })
    }
    if (!input.email && !input.pin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pin'], message: PIN_OR_EMAIL_REQUIRED_MESSAGE })
    }
  })
export type CreateOperatorInput = z.infer<typeof createOperatorSchema>
export type CreateOperatorRequest = z.input<typeof createOperatorSchema>

export const updateOperatorSchema = z.object({
  name: nameSchema.optional(),
  role: operatorRoleSchema.optional(),
  email: optionalEmailSchema,
  photoUrl: httpUrlSchema().nullable().optional(),
})
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>
export type UpdateOperatorRequest = z.input<typeof updateOperatorSchema>

export const setPinSchema = z.object({ pin: pinSchema })
export type SetPinInput = z.infer<typeof setPinSchema>

export const setActiveSchema = z.object({ active: z.boolean() })
export type SetActiveInput = z.infer<typeof setActiveSchema>
