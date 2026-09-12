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
// quem valida e grava o troco é a API. null = sem troco a mostrar.
export function changeForCash(
  paymentMethod: PaymentMethod | null,
  amountReceivedCents: number,
  totalCents: number,
): number | null {
  if (paymentMethod !== 'CASH' || !Number.isFinite(amountReceivedCents)) return null
  return amountReceivedCents - totalCents
}
