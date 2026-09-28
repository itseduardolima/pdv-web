import type { PaymentMethod } from '@pdv/shared'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { CASH: 'Dinheiro', CARD: 'Cartão', PIX: 'Pix' }
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'PIX']

// 21400 de 61240 -> 35
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

// "Pix", "Pix + Dinheiro" (pagamento misto) — formas repetidas aparecem uma
// vez só (2 cartões = "Cartão").
export function salePaymentLabel(payments: { method: PaymentMethod }[]): string {
  return [...new Set(payments.map((payment) => payment.method))]
    .map((method) => PAYMENT_METHOD_LABEL[method])
    .join(' + ')
}
