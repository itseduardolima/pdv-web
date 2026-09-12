import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { loginOperatorSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useLoginOperators() {
  return useQuery({
    queryKey: ['auth', 'operators'],
    queryFn: () => apiRequest('/auth/operators', { schema: z.array(loginOperatorSchema) }),
  })
}
