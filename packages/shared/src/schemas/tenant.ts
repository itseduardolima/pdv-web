import { z } from 'zod'
import { hexColorSchema, idSchema } from './common'

// Fonte única dos limites: o schema valida com eles e o formulário só os
// exibe como texto de apoio (nunca valida no cliente).
export const TENANT_LIMITS = {
  name: { min: 1, max: 100 },
} as const

export const publicTenantSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().url().nullable(),
  primaryColor: hexColorSchema,
  primaryInkColor: hexColorSchema,
  accentColor: hexColorSchema,
  timezone: z.string(),
})
export type PublicTenant = z.infer<typeof publicTenantSchema>

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(TENANT_LIMITS.name.min, 'Nome da loja é obrigatório.')
    .max(TENANT_LIMITS.name.max, `Nome da loja não pode ter mais de ${TENANT_LIMITS.name.max} caracteres.`),
  logoUrl: z.string().url('URL de logo inválida.').nullable(),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  timezone: z
    .string()
    .min(1, 'Fuso horário é obrigatório.')
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz })
          return true
        } catch {
          return false
        }
      },
      { message: 'Fuso horário inválido.' },
    ),
})
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
