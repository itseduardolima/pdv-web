import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

export function useDeleteProduct(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest(`/products/${id}`, { method: 'DELETE', schema: z.null() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
