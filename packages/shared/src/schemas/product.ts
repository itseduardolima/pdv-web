import { z } from 'zod'
import { idSchema } from './common'

export const productUnitSchema = z.enum(['UN', 'KG', 'L', 'PCT', 'CX'])
export type ProductUnit = z.infer<typeof productUnitSchema>

const cents = z.number().int().nonnegative()

export const productSchema = z.object({
  id: idSchema,
  name: z.string(),
  category: z.string(),
  unit: productUnitSchema,
  barcode: z.string().nullable(),
  salePriceCents: cents,
  costPriceCents: cents,
  stockQuantity: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  photoUrl: z.string().url().nullable(),
})
export type Product = z.infer<typeof productSchema>

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do produto').max(120),
  category: z.string().trim().min(1, 'Informe a categoria').max(60),
  unit: productUnitSchema,
  barcode: z.string().trim().min(1).max(64).nullable().optional(),
  salePriceCents: cents,
  costPriceCents: cents,
  stockQuantity: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  photoUrl: z.string().url().nullable().optional(),
})
export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()
export type UpdateProductInput = z.infer<typeof updateProductSchema>
