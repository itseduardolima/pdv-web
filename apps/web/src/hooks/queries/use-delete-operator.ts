import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

export function useDeleteOperator(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest(`/operators/${id}`, { method: 'DELETE', schema: z.null() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      // A tela de Login lista só os ativos: muda junto.
      queryClient.invalidateQueries({ queryKey: ['auth', 'operators'] })
    },
  })
}
