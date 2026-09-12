const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// 399 -> "R$ 3,99"
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100)
}
