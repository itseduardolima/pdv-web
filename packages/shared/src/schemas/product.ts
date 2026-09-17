import { z } from 'zod'
import { httpUrlSchema, idSchema } from './common'

export const productUnitSchema = z.enum(['UN', 'KG', 'L', 'PCT', 'CX'])
export type ProductUnit = z.infer<typeof productUnitSchema>

// Fonte única dos limites: o schema valida com eles e o formulário só os
// exibe como texto de apoio (nunca valida no cliente).
export const PRODUCT_LIMITS = {
  name: { min: 2, max: 120 },
  category: { min: 1, max: 60 },
  barcode: { max: 64 },
  defaultMinStock: 5,
} as const

// Rótulo curto + explicação simples de cada unidade, para o balão de ajuda.
export const PRODUCT_UNIT_INFO: Record<ProductUnit, { label: string; help: string }> = {
  UN: { label: 'Un (unidade)', help: 'Vendido por peça: 1 lata, 1 pacote fechado, 1 garrafa.' },
  KG: { label: 'Kg (quilo)', help: 'Vendido por peso na balança: carne, queijo, frutas.' },
  L: { label: 'L (litro)', help: 'Vendido por volume: leite a granel, bebida em litro.' },
  PCT: { label: 'Pct (pacote)', help: 'Vendido por pacote com várias peças dentro: pão de forma, fralda.' },
  CX: { label: 'Cx (caixa)', help: 'Vendido por caixa fechada: 12 latas, 6 garrafas.' },
}

// Categorias padrão de mercadinho: alimentam o seletor de categoria de toda
// loja (junto com as que a loja já usa). Texto livre continua aceito.
export const DEFAULT_PRODUCT_CATEGORIES = [
  'Bebidas',
  'Bebidas alcoólicas',
  'Estiva',
  'Hortifruti',
  'Padaria',
  'Frios e laticínios',
  'Carnes',
  'Congelados',
  'Doces e biscoitos',
  'Higiene',
  'Limpeza',
  'Bazar',
  'Pet',
  'Tabacaria',
] as const

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
  photoUrl: httpUrlSchema().nullable(),
})
export type Product = z.infer<typeof productSchema>

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Informe o nome do produto' })
    .trim()
    .min(PRODUCT_LIMITS.name.min, `O nome precisa ter pelo menos ${PRODUCT_LIMITS.name.min} caracteres`)
    .max(PRODUCT_LIMITS.name.max, `O nome pode ter no máximo ${PRODUCT_LIMITS.name.max} caracteres`),
  category: z
    .string({ required_error: 'Informe a categoria' })
    .trim()
    .min(PRODUCT_LIMITS.category.min, 'Informe a categoria')
    .max(PRODUCT_LIMITS.category.max, `A categoria pode ter no máximo ${PRODUCT_LIMITS.category.max} caracteres`),
  unit: productUnitSchema,
  // Campo em branco no formulário chega como "" e significa "sem código".
  barcode: z
    .string()
    .trim()
    .max(PRODUCT_LIMITS.barcode.max, `O código pode ter no máximo ${PRODUCT_LIMITS.barcode.max} caracteres`)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  salePriceCents: money,
  // Custo é opcional no cadastro (decisão de produto): sem informar, fica 0.
  costPriceCents: money.optional().default(0),
  stockQuantity: quantity,
  // Estoque mínimo não é campo do formulário: 5 por padrão em toda loja.
  minStock: quantity.optional().default(PRODUCT_LIMITS.defaultMinStock),
  photoUrl: httpUrlSchema().nullable().optional(),
})
export type CreateProductInput = z.infer<typeof createProductSchema>
// O que o cliente envia (custo e estoque mínimo são opcionais; a API preenche).
export type CreateProductRequest = z.input<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type UpdateProductRequest = z.input<typeof updateProductSchema>

export const productListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
})
export type ProductListQuery = z.infer<typeof productListQuerySchema>
