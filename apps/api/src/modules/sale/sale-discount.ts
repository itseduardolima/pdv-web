import type { DiscountInput } from '@pdv/shared'
import { DomainError } from '../../common/errors/domain.error'

export interface AppliedDiscount {
  discountCents: number
  discountType: DiscountInput['type'] | null
  discountValue: number | null
}

const NO_DISCOUNT: AppliedDiscount = { discountCents: 0, discountType: null, discountValue: null }

export function computeDiscount(subtotalCents: number, discount: DiscountInput | undefined): AppliedDiscount {
  if (!discount) return NO_DISCOUNT
  const discountCents =
    discount.type === 'AMOUNT' ? discount.value : Math.round((subtotalCents * discount.value) / 10000)
  if (discountCents >= subtotalCents) {
    throw new DomainError('DISCOUNT_TOO_HIGH', 'O desconto deve ser menor que o total da venda.', 400, {
      subtotalCents,
      discountCents,
    })
  }
  if (discountCents === 0) return NO_DISCOUNT
  return { discountCents, discountType: discount.type, discountValue: discount.value }
}

export function allocateDiscount(lineTotals: number[], discountCents: number): number[] {
  const subtotal = lineTotals.reduce((sum, line) => sum + line, 0)
  if (discountCents === 0 || subtotal === 0) return lineTotals.map(() => 0)
  const lines = lineTotals.map((line, index) => ({
    index,
    share: Math.floor((discountCents * line) / subtotal),
    remainder: (discountCents * line) % subtotal,
  }))
  const leftover = discountCents - lines.reduce((sum, line) => sum + line.share, 0)
  const byRemainder = [...lines].sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  const bonus = new Set(byRemainder.slice(0, leftover).map((line) => line.index))
  return lines.map((line) => line.share + (bonus.has(line.index) ? 1 : 0))
}
