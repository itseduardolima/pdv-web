// Conversão entre o texto digitado no formulário e os centavos que a API usa.
// Não é validação: texto inválido vira NaN, que o JSON serializa como null e a
// API responde com a mensagem de campo.

// "3,99" | "3.99" | "R$ 1.234,50" -> 399 | 399 | 123450
export function parseMoneyInput(text: string): number {
  const cleaned = text.replace(/[^\d,.-]/g, '')
  if (!cleaned) return NaN
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  const value = Number(normalized)
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

// 399 -> "3,99"
export function formatMoneyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

// "12" -> 12; "" | "1.5" | "abc" -> NaN
export function parseIntegerInput(text: string): number {
  return /^-?\d+$/.test(text.trim()) ? Number(text) : NaN
}
