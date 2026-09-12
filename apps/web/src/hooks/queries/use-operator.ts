import { useQuery } from '@tanstack/react-query'
import { operatorSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useOperator(id: string) {
  return useQuery({
    queryKey: ['operators', 'detail', id],
    queryFn: () => apiRequest(`/operators/${id}`, { schema: operatorSchema }),
  })
}
