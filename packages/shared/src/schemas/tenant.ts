import { z } from 'zod'
import { hexColorSchema, httpUrlSchema, idSchema } from './common'

// Fonte única dos limites: o schema valida com eles e o formulário só os
// exibe como texto de apoio (nunca valida no cliente).
export const TENANT_LIMITS = {
  name: { min: 1, max: 100 },
  // HU 11.6: quantidade de caixas físicos do tenant (4.5-4.7).
  registerCount: { min: 1, max: 10 },
} as const

export const publicTenantSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  logoUrl: httpUrlSchema().nullable(),
  primaryColor: hexColorSchema,
  primaryInkColor: hexColorSchema,
  accentColor: hexColorSchema,
  timezone: z.string(),
  // HU 4.5-4.7, 11.6: quantidade de caixas físicos da loja (default 1).
  registerCount: z.number().int().positive(),
})
export type PublicTenant = z.infer<typeof publicTenantSchema>

export const updateTenantSchema = z.object({
  name: z
    .string()
    .min(TENANT_LIMITS.name.min, 'Nome da loja é obrigatório.')
    .max(TENANT_LIMITS.name.max, `Nome da loja não pode ter mais de ${TENANT_LIMITS.name.max} caracteres.`),
  logoUrl: httpUrlSchema('URL de logo inválida.').nullable(),
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
  registerCount: z
    .number({ invalid_type_error: 'Quantidade de caixas inválida', required_error: 'Informe a quantidade de caixas' })
    .int('Quantidade de caixas inválida')
    .min(TENANT_LIMITS.registerCount.min, `Mínimo de ${TENANT_LIMITS.registerCount.min} caixa.`)
    .max(TENANT_LIMITS.registerCount.max, `Máximo de ${TENANT_LIMITS.registerCount.max} caixas.`),
})
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
