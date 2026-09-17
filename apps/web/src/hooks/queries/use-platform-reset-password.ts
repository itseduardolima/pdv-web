import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { PlatformResetPasswordInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function usePlatformResetPassword() {
  return useMutation({
    mutationFn: (input: PlatformResetPasswordInput) =>
      apiRequest('/platform/auth/reset-password', { method: 'POST', body: input, schema: z.null() }),
  })
}
