// Estoque mínimo só gera indicador visual (03-regras-negocio § Produtos).
export function isLowStock(stockQuantity: number, minStock: number): boolean {
  return stockQuantity <= minStock
}
