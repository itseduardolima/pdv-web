import { z } from 'zod'
import { idSchema } from './common'

export const productUnitSchema = z.enum(['UN', 'KG', 'L', 'PCT', 'CX'])
export type ProductUnit = z.infer<typeof productUnitSchema>

const cents = z.number().int().nonnegative()

const money = z
  .number({ invalid_type_error: 'Informe um valor válido', required_error: 'Informe um valor' })
  .int('Informe um valor válido')
  .nonnegative('O valor não pode ser negativo')
const quantity = z
  .number({ invalid_type_error: 'Informe um número inteiro', required_error: 'Informe a quantidade' })
  .int('Informe um número inteiro')
  .nonnegative('A quantidade não pode ser negativa')

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
  name: z.string({ required_error: 'Informe o nome do produto' }).trim().min(2, 'Informe o nome do produto').max(120, 'Nome muito longo'),
  category: z.string({ required_error: 'Informe a categoria' }).trim().min(1, 'Informe a categoria').max(60, 'Categoria muito longa'),
  unit: productUnitSchema,
  // Campo em branco no formulário chega como "" e significa "sem código".
  barcode: z
    .string()
    .trim()
    .max(64, 'Código muito longo')
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  salePriceCents: money,
  costPriceCents: money,
  stockQuantity: quantity,
  minStock: quantity,
  photoUrl: z.string().url().nullable().optional(),
})

export const productListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
})
export type ProductListQuery = z.infer<typeof productListQuerySchema>
export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()
export type UpdateProductInput = z.infer<typeof updateProductSchema>
