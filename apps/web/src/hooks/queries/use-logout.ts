import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

export function useLogout() {
  return useMutation({
    mutationFn: () => apiRequest('/auth/logout', { method: 'POST', schema: z.null() }),
  })
}
