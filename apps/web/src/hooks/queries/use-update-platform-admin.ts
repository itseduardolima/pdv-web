import { useMutation } from '@tanstack/react-query'
import { platformAdminSchema, type UpdatePlatformAdminInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useUpdatePlatformAdmin() {
  return useMutation({
    mutationFn: (input: UpdatePlatformAdminInput) =>
      apiRequest('/platform/auth/me', { method: 'PATCH', body: input, schema: platformAdminSchema }),
  })
}
