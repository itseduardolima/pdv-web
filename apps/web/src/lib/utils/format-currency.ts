const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })

// 399 -> "R$ 3,99"
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100)
}

// 150000 -> "R$ 1,5 mil" — rótulo curto para caber embaixo de barra estreita
// (gráficos de Ano/Hoje, muitas colunas).
export function formatCurrencyCompact(cents: number): string {
  return compactFormatter.format(cents / 100)
}
