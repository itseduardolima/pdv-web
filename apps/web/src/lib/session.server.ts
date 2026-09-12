import { cache } from 'react'
import { currentSessionSchema, type CurrentSession } from '@pdv/shared'
import { ApiClientError, apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

// Só para Server Components: sessão do operador logado, ou null (401).
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  try {
    return await apiRequest('/auth/me', { schema: currentSessionSchema, headers: await serverRequestHeaders() })
  } catch (error) {
    // Sem sessão (401) ou sem loja resolvida (404 TENANT_NOT_FOUND) é o mesmo: ninguém logado.
    if (error instanceof ApiClientError && [401, 404].includes(error.error.statusCode)) return null
    throw error
  }
})
