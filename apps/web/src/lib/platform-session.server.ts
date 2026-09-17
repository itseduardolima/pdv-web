import { cache } from 'react'
import { platformAdminSchema, type PlatformAdmin } from '@pdv/shared'
import { ApiClientError, apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

// Só para Server Components: admin de plataforma logado, ou null (401).
export const getCurrentPlatformAdmin = cache(async (): Promise<PlatformAdmin | null> => {
  try {
    return await apiRequest('/platform/auth/me', {
      schema: platformAdminSchema,
      headers: await serverRequestHeaders(),
    })
  } catch (error) {
    if (error instanceof ApiClientError && error.error.statusCode === 401) return null
    throw error
  }
})
