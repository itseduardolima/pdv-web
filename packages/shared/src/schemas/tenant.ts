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
