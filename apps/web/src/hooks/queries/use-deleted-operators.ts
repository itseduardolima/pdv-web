import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { deletedOperatorSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const deletedOperatorsQueryKey = ['operators', 'deleted'] as const

// LGPD (08-seguranca § 13): quem já foi soft-deleted, candidato a ter o
// dado pessoal removido de vez — separado da lista principal (/operators),
// que nunca traz quem já foi excluído.
export function useDeletedOperators(enabled: boolean) {
  return useQuery({
    queryKey: deletedOperatorsQueryKey,
    queryFn: () => apiRequest('/operators/deleted', { schema: z.array(deletedOperatorSchema) }),
    enabled,
  })
}
