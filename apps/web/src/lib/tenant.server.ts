import { cache } from 'react'
import { publicTenantSchema, type ApiError, type PublicTenant } from '@pdv/shared'
import { ApiClientError, apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

export type TenantResult = { tenant: PublicTenant; error: null } | { tenant: null; error: ApiError }

// Só para Server Components: resolve o tenant do request atual uma vez por
// render (cache do React) a partir do host que o browser usou.
export const getCurrentTenant = cache(async (): Promise<TenantResult> => {
  try {
    const tenant = await apiRequest('/tenant/current', {
      schema: publicTenantSchema,
      headers: await serverRequestHeaders(),
    })
    return { tenant, error: null }
  } catch (error) {
    if (error instanceof ApiClientError) return { tenant: null, error: error.error }
    throw error
  }
})
