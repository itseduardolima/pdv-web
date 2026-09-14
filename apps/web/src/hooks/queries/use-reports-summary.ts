import { useQuery } from '@tanstack/react-query'
import { reportSummarySchema, type ReportSummaryQuery } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// HU 12.1: period=custom só dispara a busca quando from/to já foram
// escolhidos — evita um 400 VALIDATION previsível enquanto o usuário ainda
// não terminou de escolher o intervalo.
export function useReportsSummary(query: ReportSummaryQuery) {
  const params = new URLSearchParams({ period: query.period })
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  const ready = query.period !== 'custom' || Boolean(query.from && query.to)

  return useQuery({
    queryKey: ['reports', 'summary', query],
    queryFn: () => apiRequest(`/reports/summary?${params.toString()}`, { schema: reportSummarySchema }),
    enabled: ready,
  })
}
