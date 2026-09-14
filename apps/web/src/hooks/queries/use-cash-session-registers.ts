import { useQuery } from '@tanstack/react-query'
import { cashSessionRegistersSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const cashSessionRegistersQueryKey = ['cash-sessions', 'registers'] as const

export function useCashSessionRegisters() {
  return useQuery({
    queryKey: cashSessionRegistersQueryKey,
    queryFn: async () =>
      (await apiRequest('/cash-sessions/registers', { schema: cashSessionRegistersSchema })).registers,
  })
}
