import { useQuery } from '@tanstack/react-query'
import { saleSchema, type SalesHistoryQuery } from '@pdv/shared'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

// Tela Histórico de Vendas: period="day" só dispara a busca quando o
// usuário já escolheu a data — mesma guarda de useReportsSummary pra
// period="custom".
export function useSalesHistory(query: SalesHistoryQuery) {
  const params = new URLSearchParams({ period: query.period })
  if (query.date) params.set('date', query.date)
  if (query.search) params.set('search', query.search)
  const ready = query.period !== 'day' || Boolean(query.date)

  return useQuery({
    queryKey: ['sales', 'history', query],
    queryFn: () => apiRequest(`/sales?${params.toString()}`, { schema: z.array(saleSchema) }),
    enabled: ready,
  })
}
