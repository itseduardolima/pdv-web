import { useQuery } from '@tanstack/react-query'
import { cashSessionSummarySchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// HU 4.7: sessão específica por id — usado pelo Administrador para abrir o
// Fechamento de um caixa que não é o dele (useCurrentCashSession só traz o
// caixa que o próprio operador abriu).
export function useCashSession(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-sessions', id],
    queryFn: () => apiRequest(`/cash-sessions/${id}`, { schema: cashSessionSummarySchema }),
    enabled: Boolean(id),
  })
}
