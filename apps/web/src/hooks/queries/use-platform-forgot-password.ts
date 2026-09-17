import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { PlatformForgotPasswordInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// Sempre 204: a API não diz se o e-mail existe (08-seguranca § 4).
export function usePlatformForgotPassword() {
  return useMutation({
    mutationFn: (input: PlatformForgotPasswordInput) =>
      apiRequest('/platform/auth/forgot-password', { method: 'POST', body: input, schema: z.null() }),
  })
}
