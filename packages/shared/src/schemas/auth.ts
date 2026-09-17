import { z } from 'zod'
import { emailSchema, httpUrlSchema, idSchema, operatorRoleSchema, pinSchema } from './common'

export const loginOperatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  photoUrl: httpUrlSchema().nullable(),
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
    photoUrl: httpUrlSchema().nullable(),
  }),
  tenantId: idSchema,
})
export type CurrentSession = z.infer<typeof currentSessionSchema>

// "Esqueci meu PIN": pede só o e-mail; a resposta é sempre a mesma, exista
// ou não um operador com ele (08-seguranca § 4).
export const forgotPinInputSchema = z.object({ email: emailSchema })
export type ForgotPinInput = z.infer<typeof forgotPinInputSchema>

export const pinTokenPurposeSchema = z.enum(['FIRST_ACCESS', 'RESET'])
export type PinTokenPurpose = z.infer<typeof pinTokenPurposeSchema>

// O que a tela "Definir PIN" mostra antes de o operador digitar.
export const pinTokenInfoSchema = z.object({
  operatorName: z.string(),
  purpose: pinTokenPurposeSchema,
})
export type PinTokenInfo = z.infer<typeof pinTokenInfoSchema>

export const setPinWithTokenInputSchema = z.object({
  token: z.string().min(1, 'Link inválido'),
  pin: pinSchema,
})
export type SetPinWithTokenInput = z.infer<typeof setPinWithTokenInputSchema>
