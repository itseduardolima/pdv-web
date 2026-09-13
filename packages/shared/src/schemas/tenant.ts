import { z } from 'zod'
import { hexColorSchema, idSchema } from './common'

export const publicTenantSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().url().nullable(),
  primaryColor: hexColorSchema,
  primaryInkColor: hexColorSchema,
  accentColor: hexColorSchema,
})
export type PublicTenant = z.infer<typeof publicTenantSchema>

export const updateTenantSchema = z.object({
  name: z.string().min(1, 'Nome da loja é obrigatório.').max(100, 'Nome da loja não pode ter mais de 100 caracteres.'),
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
