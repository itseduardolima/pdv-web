import { useQuery } from '@tanstack/react-query'
import { currentCashSessionSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const currentCashSessionQueryKey = ['cash-sessions', 'mine'] as const

// HU 4.7: o caixa que O OPERADOR LOGADO abriu — não "qualquer" sessão aberta
// no tenant (essa é `getCurrentCashSession`, lib/cash-session.server.ts, só
// pro guard de rota decidir se a loja está operando). Usado por Vender e
// Fechamento pra saber com qual caixa agir.
export function useCurrentCashSession() {
  return useQuery({
    queryKey: currentCashSessionQueryKey,
    queryFn: async () => (await apiRequest('/cash-sessions/mine', { schema: currentCashSessionSchema })).session,
  })
}
