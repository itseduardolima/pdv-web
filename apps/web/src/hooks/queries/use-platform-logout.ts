import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

export function usePlatformLogout() {
  return useMutation({
    mutationFn: () => apiRequest('/platform/auth/logout', { method: 'POST', schema: z.null() }),
  })
}
