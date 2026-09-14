import { cache } from 'react'
import { currentCashSessionSchema, type CashSessionSummary } from '@pdv/shared'
import { apiRequest } from './api-client'
import { serverRequestHeaders } from './server-headers'

// Só para Server Components: "a loja está operando hoje" — QUALQUER caixa
// aberto no tenant, não importa quem abriu. Usado só pelo guard de
// `(operating)/layout.tsx` pra liberar Vender/Produtos/Fechamento/Dashboard/
// Operadores; nunca pra saber se ESTE operador já abriu o dele (isso é
// `getMyCashSession`, abaixo — ver HU 4.7).
export const getCurrentCashSession = cache(async (): Promise<CashSessionSummary | null> => {
  const result = await apiRequest('/cash-sessions/current', {
    schema: currentCashSessionSchema,
    headers: await serverRequestHeaders(),
  })
  return result.session
})

// Só para Server Components: o caixa que O OPERADOR LOGADO abriu, ou null —
// usado por `open-register/layout.tsx` pra decidir se ainda faz sentido
// mostrar a tela de Abertura. Tenant-wide (getCurrentCashSession) não serve
// aqui: com múltiplos caixas, outro operador já ter aberto o dele não pode
// impedir este operador de abrir o próprio.
export const getMyCashSession = cache(async (): Promise<CashSessionSummary | null> => {
  const result = await apiRequest('/cash-sessions/mine', {
    schema: currentCashSessionSchema,
    headers: await serverRequestHeaders(),
  })
  return result.session
})
