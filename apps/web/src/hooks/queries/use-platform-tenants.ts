import { useQuery } from '@tanstack/react-query'
import { platformTenantPageSchema, type PlatformTenantListQuery } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const platformTenantsQueryKey = (query: PlatformTenantListQuery) => ['platform-tenants', query] as const

export function usePlatformTenants(query: PlatformTenantListQuery) {
  const params = new URLSearchParams()
  params.set('page', String(query.page))
  params.set('pageSize', String(query.pageSize))
  if (query.q) params.set('q', query.q)

  return useQuery({
    queryKey: platformTenantsQueryKey(query),
    queryFn: () => apiRequest(`/platform/tenants?${params.toString()}`, { schema: platformTenantPageSchema }),
    placeholderData: (previous) => previous,
  })
}
