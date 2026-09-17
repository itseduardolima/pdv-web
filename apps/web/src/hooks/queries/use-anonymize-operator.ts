import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'
import { deletedOperatorsQueryKey } from './use-deleted-operators'

// LGPD (08-seguranca § 13): irreversível — zera nome/foto/PIN de vez. Um
// hook para a lista inteira de excluídos: cada card passa o próprio id
// (mesmo padrão de useSetOperatorActive).
export function useAnonymizeOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/operators/${id}/anonymize`, { method: 'POST', schema: z.null() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deletedOperatorsQueryKey })
    },
  })
}
