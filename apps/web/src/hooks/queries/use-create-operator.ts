import { useMutation, useQueryClient } from '@tanstack/react-query'
import { operatorSchema, type CreateOperatorRequest } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCreateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOperatorRequest) =>
      apiRequest('/operators', { method: 'POST', body: input, schema: operatorSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      // A tela de Login lista só os ativos: muda junto.
      queryClient.invalidateQueries({ queryKey: ['auth', 'operators'] })
    },
  })
}
