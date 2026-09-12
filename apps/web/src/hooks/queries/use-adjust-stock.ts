import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productSchema, type Product } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// Atalho de estoque (ex.: "sem estoque" no meio de uma venda): só manda
// stockQuantity, o resto do produto não muda — mesma rota de editar
// produto (updateProductSchema aceita patch parcial), só admin (ADMIN_ONLY).
export function useAdjustStock(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stockQuantity: number): Promise<Product> =>
      apiRequest(`/products/${productId}`, { method: 'PATCH', body: { stockQuantity }, schema: productSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
