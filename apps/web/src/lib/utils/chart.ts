// Altura de cada barra em proporção ao maior valor (0..1). Tudo zero -> tudo 0.
export function scaleBars(values: number[]): number[] {
  const max = Math.max(0, ...values)
  return values.map((value) => (max > 0 ? value / max : 0))
}
