import type { PaymentMethod } from '@pdv/shared'

export interface CartItem {
  productId: string
  name: string
  unit: string
  unitPriceCents: number
  quantity: number
}

export function cartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0)
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

// Busca local no catálogo já carregado: nome, categoria ou código de barras.
export function matchesProductSearch(
  product: { name: string; category: string; barcode: string | null },
  term: string,
): boolean {
  const query = term.trim().toLowerCase()
  if (!query) return true
  return (
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.barcode === term.trim()
  )
}

// Troco exibido ao vivo enquanto o operador digita. Só orientação visual:
// quem valida e grava o troco é a API. null = sem troco a mostrar. Só existe
// na venda com uma forma só (no pagamento misto o campo não aparece).
export function changeForCash(
  paymentMethod: PaymentMethod | null,
  amountReceivedCents: number,
  totalCents: number,
): number | null {
  if (paymentMethod !== 'CASH' || !Number.isFinite(amountReceivedCents)) return null
  return amountReceivedCents - totalCents
}

// "Dividir igualmente" entre `parts` pagamentos: cada um leva o piso da
// divisão e o último absorve os centavos que sobram (291,94 / 3 = 97,31 +
// 97,31 + 97,32). Só sugere valores — a API confere a soma.
export function splitEvenly(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts)
  return Array.from({ length: parts }, (_, index) => (index === parts - 1 ? totalCents - base * (parts - 1) : base))
}
