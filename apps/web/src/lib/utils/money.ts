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

// 399 -> "3,99"; 123456 -> "1.234,56" — mesma formatação usada na máscara
// de digitação (com separador de milhar), para preencher o campo ao editar
// um produto existente.
export function formatMoneyMasked(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Máscara de dinheiro no estilo calculadora: cada dígito novo entra pela
// direita, como o usuário digita o Preço de venda. "1" "12" "123" ->
// "0,01" "0,12" "1,23". Ignora tudo que não for dígito, então colar um
// valor já formatado ("R$ 12,50") também funciona.
export function maskMoneyInput(rawText: string): string {
  const digits = rawText.replace(/\D/g, '')
  return digits ? formatMoneyMasked(Number(digits)) : ''
}

// "12" -> 12; "" | "1.5" | "abc" -> NaN
export function parseIntegerInput(text: string): number {
  return /^-?\d+$/.test(text.trim()) ? Number(text) : NaN
}
