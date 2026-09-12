import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cashSessionSummarySchema, type OpenCashSessionInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useOpenCashSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OpenCashSessionInput) =>
      apiRequest('/cash-sessions', { method: 'POST', body: input, schema: cashSessionSummarySchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash-sessions'] }),
  })
}
