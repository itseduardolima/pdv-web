import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformTenantSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useSetTenantActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiRequest(`/platform/tenants/${id}/active`, { method: 'PATCH', body: { active }, schema: platformTenantSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-tenants'] }),
  })
}
