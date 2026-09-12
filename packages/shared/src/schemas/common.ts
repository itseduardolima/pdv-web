import { z } from 'zod'

export const idSchema = z.string().min(1)

export const operatorRoleSchema = z.enum(['ADMIN', 'OPERATOR'])
export type OperatorRole = z.infer<typeof operatorRoleSchema>

export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'PIX'], {
  errorMap: () => ({ message: 'Escolha a forma de pagamento' }),
})
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const emailSchema = z
  .string({ required_error: 'Informe o e-mail' })
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido')
  .max(160, 'O e-mail pode ter no máximo 160 caracteres')

export const pinSchema = z.string().regex(/^\d{4}$/, 'O PIN deve ter exatamente 4 dígitos')

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato #RRGGBB')

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof apiErrorSchema>
