import { cache } from 'react'
import { currentCashSessionSchema, type CashSessionSummary } from '@pdv/shared'
import { apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

// Só para Server Components: caixa aberto do tenant, ou null.
export const getCurrentCashSession = cache(async (): Promise<CashSessionSummary | null> => {
  const result = await apiRequest('/cash-sessions/current', {
    schema: currentCashSessionSchema,
    headers: await serverRequestHeaders(),
  })
  return result.session
})
