import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { saleSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCashSessionSales(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-sessions', id, 'sales'],
    queryFn: () => apiRequest(`/cash-sessions/${id}/sales`, { schema: z.array(saleSchema) }),
    enabled: Boolean(id),
  })
}
