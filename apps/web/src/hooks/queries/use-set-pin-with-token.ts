import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { SetPinWithTokenInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useSetPinWithToken() {
  return useMutation({
    mutationFn: (input: SetPinWithTokenInput) =>
      apiRequest('/auth/set-pin', { method: 'POST', body: input, schema: z.null() }),
  })
}
