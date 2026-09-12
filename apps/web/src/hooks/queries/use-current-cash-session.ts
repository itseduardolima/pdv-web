import { useQuery } from '@tanstack/react-query'
import { currentCashSessionSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const currentCashSessionQueryKey = ['cash-sessions', 'current'] as const

export function useCurrentCashSession() {
  return useQuery({
    queryKey: currentCashSessionQueryKey,
    queryFn: async () => (await apiRequest('/cash-sessions/current', { schema: currentCashSessionSchema })).session,
  })
}
