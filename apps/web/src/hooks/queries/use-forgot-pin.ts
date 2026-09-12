import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { ForgotPinInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// Sempre 204: a API não diz se o e-mail existe (08-seguranca § 4).
export function useForgotPin() {
  return useMutation({
    mutationFn: (input: ForgotPinInput) =>
      apiRequest('/auth/forgot-pin', { method: 'POST', body: input, schema: z.null() }),
  })
}
