import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cashSessionSummarySchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCloseCashSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest(`/cash-sessions/${id}/close`, { method: 'POST', schema: cashSessionSummarySchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash-sessions'] }),
  })
}
