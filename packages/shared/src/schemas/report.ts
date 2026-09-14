import { z } from 'zod'
import { paymentMethodSchema } from './common'

const cents = z.number().int().nonnegative()
// Dia no fuso da loja, "YYYY-MM-DD" — não é um instante, é um rótulo de dia
// (mesma convenção do Dashboard, ver schemas/dashboard.ts).
const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// HU 12.1: "hoje"/"semana"/"mês" são calculados no fuso da loja a partir de
// hoje (semana = 7 dias, mês = 30 dias corridos, não mês-calendário — evita
// o caso de dia 1 do mês ter um "mês" de 1 dia só); "personalizado" exige
// from/to do próprio usuário.
export const reportPeriodSchema = z.enum(['today', 'week', 'month', 'custom'])
export type ReportPeriod = z.infer<typeof reportPeriodSchema>

export const reportSummaryQuerySchema = z
  .object({
    period: reportPeriodSchema,
    from: dayKey.optional(),
    to: dayKey.optional(),
  })
  .refine((v) => v.period !== 'custom' || (v.from !== undefined && v.to !== undefined && v.from <= v.to), {
    message: 'Informe um intervalo de datas válido (de/até).',
    path: ['from'],
  })
export type ReportSummaryQuery = z.infer<typeof reportSummaryQuerySchema>

export const reportDaySchema = z.object({
  date: dayKey,
  totalCents: cents,
  salesCount: z.number().int().nonnegative(),
})
export type ReportDay = z.infer<typeof reportDaySchema>

export const reportTopProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  photoUrl: z.string().url().nullable(),
  quantity: z.number().int().positive(),
  totalCents: cents,
})
export type ReportTopProduct = z.infer<typeof reportTopProductSchema>

// HU 12.6: distribuição de vendas por operador no período — visão de
// negócio (quem vendeu quanto), não é ferramenta de vigilância.
export const reportOperatorSchema = z.object({
  operatorId: z.string(),
  name: z.string(),
  totalCents: cents,
  percent: z.number().int().min(0).max(100),
})
export type ReportOperator = z.infer<typeof reportOperatorSchema>

// HU 12.7: produtos ativos com pouquíssima (ou nenhuma) venda no período —
// diferente de "ordenar os mais vendidos ao contrário", precisa incluir
// quem não vendeu nada.
export const reportStagnantProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  photoUrl: z.string().url().nullable(),
  quantitySold: z.number().int().nonnegative(),
})
export type ReportStagnantProduct = z.infer<typeof reportStagnantProductSchema>

export const REPORT_TOP_PRODUCTS = 5
export const REPORT_STAGNANT_PRODUCTS = 5
// HU 12.7: "parado" = vendeu isso ou menos unidades no período.
export const REPORT_STAGNANT_THRESHOLD_UNITS = 2

export const reportSummarySchema = z.object({
  period: reportPeriodSchema,
  from: dayKey,
  to: dayKey,
  totalCents: cents,
  salesCount: z.number().int().nonnegative(),
  // HU 12.2: período anterior de duração idêntica, imediatamente anterior.
  // deltaPercent null quando o período anterior não teve nenhuma venda
  // (divisão por zero não tem "porcentagem de variação" que faça sentido).
  previousPeriod: z.object({
    totalCents: cents,
    deltaPercent: z.number().nullable(),
  }),
  byPaymentMethod: z.record(paymentMethodSchema, cents),
  days: z.array(reportDaySchema),
  topProducts: z.array(reportTopProductSchema),
  byOperator: z.array(reportOperatorSchema),
  stagnantProducts: z.array(reportStagnantProductSchema),
})
export type ReportSummary = z.infer<typeof reportSummarySchema>
