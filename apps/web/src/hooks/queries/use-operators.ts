import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { operatorSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const operatorsQueryKey = ['operators'] as const

// Lista de gestão (admin): inclui inativos, ao contrário de /auth/operators.
export function useOperators() {
  return useQuery({
    queryKey: operatorsQueryKey,
    queryFn: () => apiRequest('/operators', { schema: z.array(operatorSchema) }),
  })
}
