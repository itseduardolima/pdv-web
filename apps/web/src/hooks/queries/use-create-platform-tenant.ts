import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformTenantSchema, type CreatePlatformTenantInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCreatePlatformTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlatformTenantInput) =>
      apiRequest('/platform/tenants', { method: 'POST', body: input, schema: platformTenantSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-tenants'] }),
  })
}
