import { z } from 'zod'
import { idSchema } from './common'

const cents = z.number().int().nonnegative()

export const cashSessionSchema = z.object({
  id: idSchema,
  sequence: z.number().int().positive(),
  // Caixa físico (HU 4.5): 1 quando o tenant tem um único caixa (v1 default).
  registerNumber: z.number().int().positive(),
  openedById: idSchema,
  openedByName: z.string(),
  openingAmountCents: cents,
  note: z.string().nullable(),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  totalCashCents: cents.nullable(),
  totalCardCents: cents.nullable(),
  totalPixCents: cents.nullable(),
})
export type CashSession = z.infer<typeof cashSessionSchema>

// Sessão + totais calculados ao vivo (aberta) ou congelados (fechada).
export const cashSessionSummarySchema = cashSessionSchema.extend({
  totals: z.object({ CASH: cents, CARD: cents, PIX: cents }),
  totalCents: cents,
  salesCount: z.number().int().nonnegative(),
})
export type CashSessionSummary = z.infer<typeof cashSessionSummarySchema>

// GET /cash-sessions/current: envelope porque um JSON `null` solto vira corpo vazio.
export const currentCashSessionSchema = z.object({ session: cashSessionSummarySchema.nullable() })
export type CurrentCashSession = z.infer<typeof currentCashSessionSchema>

// HU 4.6: status de cada caixa físico do tenant, pra Abertura de Caixa
// mostrar quais estão livres e quais já têm operador.
export const cashSessionRegisterSchema = z.object({
  registerNumber: z.number().int().positive(),
  // Sessão aberta neste caixa, se houver — permite o Administrador abrir o
  // Fechamento de um caixa que não é o dele (HU 4.7).
  sessionId: idSchema.nullable(),
  openedById: idSchema.nullable(),
  openedByName: z.string().nullable(),
  openedAt: z.string().datetime().nullable(),
})
export type CashSessionRegister = z.infer<typeof cashSessionRegisterSchema>

export const cashSessionRegistersSchema = z.object({ registers: z.array(cashSessionRegisterSchema) })
export type CashSessionRegisters = z.infer<typeof cashSessionRegistersSchema>

export const openCashSessionSchema = z.object({
  // HU 4.5-4.6: qual caixa físico está sendo aberto (1..tenant.registerCount).
  // Opcional/default 1 até a tela de seleção (HU 4.6) existir — não quebra o
  // tenant com um único caixa, que nunca precisa informar isso.
  registerNumber: z
    .number({ invalid_type_error: 'Caixa inválido' })
    .int('Caixa inválido')
    .positive('Caixa inválido')
    .optional(),
  openingAmountCents: z
    .number({ invalid_type_error: 'Informe um valor válido', required_error: 'Informe o valor inicial' })
    .int('Informe um valor válido')
    .nonnegative('O valor não pode ser negativo'),
  note: z.string().trim().max(200, 'Observação muito longa').optional(),
})
export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>
