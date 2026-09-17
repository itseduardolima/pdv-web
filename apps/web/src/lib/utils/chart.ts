// Altura de cada barra em proporção ao maior valor (0..1). Tudo zero -> tudo 0.
export function scaleBars(values: number[]): number[] {
  const max = Math.max(0, ...values)
  return values.map((value) => (max > 0 ? value / max : 0))
}

// Em telas estreitas, gráficos com muitas colunas (30 dias, 24 horas) não
// cabem um rótulo por barra sem sobrepor texto. Escolhe um subconjunto
// espaçado (~targetCount rótulos, sempre incluindo a última coluna) para
// exibir só no mobile — o restante fica visível a partir do breakpoint md.
export function isSparseLabelIndex(index: number, columns: number, targetCount = 6): boolean {
  if (columns <= targetCount) return true
  const step = Math.max(1, Math.round(columns / targetCount))
  return index % step === 0 || index === columns - 1
}
