import { useMutation } from '@tanstack/react-query'
import { publicTenantSchema, type UpdateTenantInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useUpdateTenant() {
  return useMutation({
    mutationFn: (input: UpdateTenantInput) =>
      apiRequest('/tenant/current', { method: 'PATCH', body: input, schema: publicTenantSchema }),
  })
}
