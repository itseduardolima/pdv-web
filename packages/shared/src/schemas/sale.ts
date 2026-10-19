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

// Teto de formas de pagamento numa venda (partes explícitas + o resto).
export const MAX_SALE_PAYMENTS = 5

// Pagamento misto: `partialPayments` são as partes pagas com valor explícito
// (cada uma na sua forma); `paymentMethod` paga o resto. A API valida que a
// soma das partes fica abaixo do total.
export const partialPaymentSchema = z.object({
  method: paymentMethodSchema,
  amountCents: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .int('Informe um valor válido')
    .positive('O valor deve ser maior que zero'),
})
export type PartialPayment = z.infer<typeof partialPaymentSchema>

export const discountTypeSchema = z.enum(['AMOUNT', 'PERCENT'])
export type DiscountType = z.infer<typeof discountTypeSchema>
export const MAX_DISCOUNT_PERCENT_BASIS_POINTS = 9999

export const discountInputSchema = z
  .object({
    type: discountTypeSchema,
    value: z
      .number({ invalid_type_error: 'Informe um valor de desconto válido' })
      .int('Informe um valor de desconto válido')
      .positive('O desconto deve ser maior que zero'),
  })
  .refine((d) => d.type !== 'PERCENT' || d.value <= MAX_DISCOUNT_PERCENT_BASIS_POINTS, {
    message: 'A porcentagem de desconto deve ser menor que 100%',
    path: ['value'],
  })
export type DiscountInput = z.infer<typeof discountInputSchema>

export const createSaleSchema = z.object({
  uuid: z.string().uuid('Identificador da venda inválido'),
  items: z.array(saleItemInputSchema).min(1, 'Adicione ao menos um item ao carrinho'),
  paymentMethod: paymentMethodSchema,
  discount: discountInputSchema.optional(),
  partialPayments: z
    .array(partialPaymentSchema)
    .max(MAX_SALE_PAYMENTS - 1, `No máximo ${MAX_SALE_PAYMENTS} formas de pagamento por venda`)
    .optional(),
  // Só para Dinheiro e opcional: quanto o cliente entregou pela parte em
  // Dinheiro. A API calcula o troco e recusa se for menor que essa parte; em
  // Cartão/Pix é ignorado.
  amountReceivedCents: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .int('Informe um valor válido')
    .nonnegative('O valor não pode ser negativo')
    .optional(),
  soldAt: z.string().datetime().optional(),
})
export type CreateSaleInput = z.infer<typeof createSaleSchema>

export const voidSaleSchema = z.object({
  reason: z
    .string({ required_error: 'Informe o motivo da anulação' })
    .trim()
    .min(1, 'Informe o motivo da anulação')
    .min(5, 'Descreva o motivo em pelo menos 5 caracteres')
    .max(200, 'O motivo pode ter no máximo 200 caracteres'),
})
export type VoidSaleInput = z.infer<typeof voidSaleSchema>

export const syncSalesSchema = z.object({
  sales: z.array(createSaleSchema).min(1).max(200),
})
export type SyncSalesInput = z.infer<typeof syncSalesSchema>

export const saleItemSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: cents,
  discountCents: cents,
})

export const salePaymentSchema = z.object({ method: paymentMethodSchema, amountCents: cents })
export type SalePayment = z.infer<typeof salePaymentSchema>

export const saleSchema = z.object({
  id: idSchema,
  uuid: z.string().uuid(),
  cashSessionId: idSchema,
  operatorId: idSchema,
  operatorName: z.string(),
  paymentMethod: paymentMethodSchema,
  // 1 a 5 formas de pagamento; a soma é totalCents.
  payments: z.array(salePaymentSchema).min(1).max(MAX_SALE_PAYMENTS),
  subtotalCents: cents,
  discountCents: cents,
  discount: discountInputSchema.nullable(),
  totalCents: cents,
  // Preenchidos só em venda em Dinheiro com valor recebido informado.
  amountReceivedCents: cents.nullable(),
  changeCents: cents.nullable(),
  soldAt: z.string().datetime(),
  // Venda anulada continua no histórico, marcada (03-regras-negocio § Venda).
  // Só o Administrador anula, e só com o caixa da venda aberto e a venda não
  // anulada — a API calcula `voidable` para a tela não oferecer o que falha.
  voidable: z.boolean(),
  voidedAt: z.string().datetime().nullable(),
  voidReason: z.string().nullable(),
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
