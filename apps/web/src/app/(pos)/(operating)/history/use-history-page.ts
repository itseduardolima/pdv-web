import { useState } from 'react'
import type { Sale, SalesHistoryPeriod } from '@pdv/shared'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useSalesHistory } from '@/hooks/queries/use-sales-history'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

// "Escolher dia" não troca de período na hora — só quando o usuário aplica
// uma data no calendário (mesma ideia do "Personalizado" de Relatórios).
export const DIRECT_PERIOD_OPTIONS: { value: 'today' | 'yesterday'; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
]

export function useHistoryPage() {
  const [period, setPeriod] = useState<SalesHistoryPeriod>('today')
  const [date, setDate] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const history = useSalesHistory({
    period,
    date: period === 'day' && date ? date : undefined,
    search: debouncedSearch.trim() || undefined,
  })

  function handlePeriodChange(next: 'today' | 'yesterday') {
    setPeriod(next)
  }

  function handleApplyDay(day: string) {
    setDate(day)
    setPeriod('day')
  }

  return {
    directPeriodOptions: DIRECT_PERIOD_OPTIONS,
    period,
    handlePeriodChange,
    dayValue: { from: date, to: date },
    handleApplyDay,
    search,
    handleSearchChange: setSearch,
    sales: history.data ?? [],
    isLoading: history.isPending,
    errorMessage: apiErrorMessage(history.error),
    selectedSale,
    handleSelectSale: setSelectedSale,
    handleCloseSaleDetails: () => setSelectedSale(null),
  }
}
