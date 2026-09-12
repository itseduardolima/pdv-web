import { useQuery } from '@tanstack/react-query'
import { dashboardSummarySchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

const REFRESH_MS = 60_000

// Resumo do dia no fuso da loja; atualiza sozinho a cada minuto enquanto a
// tela está aberta (o dono acompanha o dia sem dar F5).
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiRequest('/dashboard/summary', { schema: dashboardSummarySchema }),
    refetchInterval: REFRESH_MS,
  })
}
