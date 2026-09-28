import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saleSchema, type VoidSaleInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useVoidSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: VoidSaleInput & { id: string }) =>
      apiRequest(`/sales/${id}/void`, { method: 'POST', body: input, schema: saleSchema }),
    onSuccess: () => {
      // Estoque devolvido e a venda sai de todos os totais.
      for (const key of ['products', 'sales', 'cash-sessions', 'dashboard', 'reports']) {
        void queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })
}
