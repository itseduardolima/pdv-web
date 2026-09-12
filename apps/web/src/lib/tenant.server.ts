import { cache } from 'react'
import { headers } from 'next/headers'
import { publicTenantSchema, type ApiError, type PublicTenant } from '@pdv/shared'
import { ApiClientError, apiRequest, TENANT_HOST_HEADER } from './api-client'

export type TenantResult = { tenant: PublicTenant; error: null } | { tenant: null; error: ApiError }

// Só para Server Components: resolve o tenant do request atual uma vez por
// render (cache do React) a partir do host que o browser usou.
export const getCurrentTenant = cache(async (): Promise<TenantResult> => {
  const host = (await headers()).get('host') ?? ''
  try {
    const tenant = await apiRequest('/tenant/current', {
      schema: publicTenantSchema,
      headers: { [TENANT_HOST_HEADER]: host },
    })
    return { tenant, error: null }
  } catch (error) {
    if (error instanceof ApiClientError) return { tenant: null, error: error.error }
    throw error
  }
})
