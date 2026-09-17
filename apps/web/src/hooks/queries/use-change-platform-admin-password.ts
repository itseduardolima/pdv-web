import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { ChangePlatformAdminPasswordInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useChangePlatformAdminPassword() {
  return useMutation({
    mutationFn: (input: ChangePlatformAdminPasswordInput) =>
      apiRequest('/platform/auth/password', { method: 'PATCH', body: input, schema: z.null() }),
  })
}
