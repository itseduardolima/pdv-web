import { useMutation, useQueryClient } from '@tanstack/react-query'
import { operatorSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

interface SetActiveVariables {
  id: string
  active: boolean
}

// Um hook para a lista inteira: o toggle de cada linha passa o id.
export function useSetOperatorActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: SetActiveVariables) =>
      apiRequest(`/operators/${id}/active`, { method: 'PATCH', body: { active }, schema: operatorSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      // A tela de Login lista só os ativos: muda junto.
      queryClient.invalidateQueries({ queryKey: ['auth', 'operators'] })
    },
  })
}
