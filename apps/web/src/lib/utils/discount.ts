import type { DiscountInput, DiscountType } from '@pdv/shared'
import { parseMoneyInput, parsePercentInput } from './money'

function parseDiscountValue(type: DiscountType, text: string): number {
  return type === 'AMOUNT' ? parseMoneyInput(text) : parsePercentInput(text)
}

export function buildDiscountInput(type: DiscountType, text: string): DiscountInput | undefined {
  if (text.trim() === '') return undefined
  return { type, value: parseDiscountValue(type, text) }
}

export function previewDiscountCents(subtotalCents: number, type: DiscountType, text: string): number {
  const value = parseDiscountValue(type, text)
  if (!Number.isFinite(value) || value <= 0) return 0
  const cents = type === 'AMOUNT' ? value : Math.round((subtotalCents * value) / 10000)
  return cents < subtotalCents ? cents : 0
}

export function discountLabel(discount: DiscountInput | null): string {
  if (discount?.type === 'PERCENT') {
    return `Desconto (${(discount.value / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%)`
  }
  return 'Desconto'
}
