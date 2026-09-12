import { useMutation, useQueryClient } from '@tanstack/react-query'
import { operatorSchema, type UpdateOperatorRequest } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useUpdateOperator(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateOperatorRequest) =>
      apiRequest(`/operators/${id}`, { method: 'PATCH', body: input, schema: operatorSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      // A tela de Login lista só os ativos: muda junto.
      queryClient.invalidateQueries({ queryKey: ['auth', 'operators'] })
    },
  })
}
