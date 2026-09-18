import { z } from 'zod'
import { apiErrorSchema, idSchema, paymentMethodSchema } from './common'

const cents = z.number().int().nonnegative()

export const saleItemInputSchema = z.object({
  productId: idSchema,
  quantity: z
    .number({ invalid_type_error: 'Quantidade inválida' })
    .int('Quantidade inválida')
    .positive('A quantidade deve ser maior que zero'),
})

export const createSaleSchema = z.object({
  uuid: z.string().uuid('Identificador da venda inválido'),
  items: z.array(saleItemInputSchema).min(1, 'Adicione ao menos um item ao carrinho'),
  paymentMethod: paymentMethodSchema,
  // Só para Dinheiro e opcional: quanto o cliente entregou. A API calcula o
  // troco e recusa se for menor que o total; em Cartão/Pix é ignorado.
  amountReceivedCents: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .int('Informe um valor válido')
    .nonnegative('O valor não pode ser negativo')
    .optional(),
  soldAt: z.string().datetime().optional(),
})
export type CreateSaleInput = z.infer<typeof createSaleSchema>

export const syncSalesSchema = z.object({
  sales: z.array(createSaleSchema).min(1).max(200),
})
export type SyncSalesInput = z.infer<typeof syncSalesSchema>

export const saleItemSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: cents,
})

export const saleSchema = z.object({
  id: idSchema,
  uuid: z.string().uuid(),
  cashSessionId: idSchema,
  operatorId: idSchema,
  operatorName: z.string(),
  paymentMethod: paymentMethodSchema,
  totalCents: cents,
  // Preenchidos só em venda em Dinheiro com valor recebido informado.
  amountReceivedCents: cents.nullable(),
  changeCents: cents.nullable(),
  soldAt: z.string().datetime(),
  items: z.array(saleItemSchema),
})
export type Sale = z.infer<typeof saleSchema>

// Resultado por venda da fila (HU 8.2): a sincronização é sequencial e
// parcial — uma venda com erro (ex.: estoque insuficiente nesse meio-tempo)
// não derruba as outras do lote, então o cliente processa item a item.
export const syncSaleResultSchema = z.object({
  uuid: z.string().uuid(),
  ok: z.boolean(),
  sale: saleSchema.optional(),
  error: apiErrorSchema.optional(),
})
export type SyncSaleResult = z.infer<typeof syncSaleResultSchema>

export const syncSalesResultSchema = z.object({ results: z.array(syncSaleResultSchema) })
export type SyncSalesResult = z.infer<typeof syncSalesResultSchema>

// Tela Histórico de Vendas: sempre um único dia de calendário no fuso da
// loja (não intervalo) — "day" exige `date` (mesma convenção de dayKey de
// schemas/report.ts). Busca por produto é texto livre contra o nome
// congelado no momento da venda (SaleItem.productName).
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const salesHistoryPeriodSchema = z.enum(['today', 'yesterday', 'day'])
export type SalesHistoryPeriod = z.infer<typeof salesHistoryPeriodSchema>

export const salesHistoryQuerySchema = z
  .object({
    period: salesHistoryPeriodSchema,
    date: dayKey.optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .refine((v) => v.period !== 'day' || v.date !== undefined, {
    message: 'Informe o dia.',
    path: ['date'],
  })
export type SalesHistoryQuery = z.infer<typeof salesHistoryQuerySchema>
