import { cache } from 'react'
import { currentSessionSchema, type CurrentSession } from '@pdv/shared'
import { ApiClientError, apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

// Só para Server Components: sessão do operador logado, ou null (401).
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  try {
    return await apiRequest('/auth/me', { schema: currentSessionSchema, headers: await serverRequestHeaders() })
  } catch (error) {
    if (error instanceof ApiClientError && error.error.statusCode === 401) return null
    throw error
  }
})
