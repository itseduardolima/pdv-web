import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saleSchema, type CreateSaleInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => apiRequest('/sales', { method: 'POST', body: input, schema: saleSchema }),
    onSuccess: () => {
      // Estoque mudou e o caixa tem uma venda nova.
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}
