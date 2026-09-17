import { useMutation } from '@tanstack/react-query'
import { platformAdminSchema, type PlatformLoginInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function usePlatformLogin() {
  return useMutation({
    mutationFn: (input: PlatformLoginInput) =>
      apiRequest('/platform/auth/login', { method: 'POST', body: input, schema: platformAdminSchema }),
  })
}
