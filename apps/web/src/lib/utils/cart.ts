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
