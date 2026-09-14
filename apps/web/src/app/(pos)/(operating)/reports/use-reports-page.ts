import { useState } from 'react'
import type { ReportPeriod } from '@pdv/shared'
import { useReportsSummary } from '@/hooks/queries/use-reports-summary'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { PAYMENT_METHODS, percentOf } from '@/lib/utils/payment-method'

// "Personalizado" não é um botão de troca direta — abre o calendário
// (DateRangePopover) e só vira o período ativo quando o usuário aplica um
// intervalo. Os outros três trocam na hora, como sempre.
export const DIRECT_PERIOD_OPTIONS: { value: 'today' | 'week' | 'month'; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

export function useReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const [customFrom, setCustomFrom] = useState<string | null>(null)
  const [customTo, setCustomTo] = useState<string | null>(null)

  const summary = useReportsSummary({
    period,
    from: period === 'custom' && customFrom ? customFrom : undefined,
    to: period === 'custom' && customTo ? customTo : undefined,
  })
  const data = summary.data ?? null

  function handlePeriodChange(next: 'today' | 'week' | 'month') {
    setPeriod(next)
  }

  // Só troca pra "custom" (e dispara a busca) quando o usuário aplica o
  // intervalo no calendário — até lá, o período anterior continua na tela.
  function handleApplyCustomRange(from: string, to: string) {
    setCustomFrom(from)
    setCustomTo(to)
    setPeriod('custom')
  }

  const tiles = data
    ? PAYMENT_METHODS.map((method) => ({
        method,
        cents: data.byPaymentMethod[method] ?? 0,
        percent: percentOf(data.byPaymentMethod[method] ?? 0, data.totalCents),
      }))
    : []

  return {
    directPeriodOptions: DIRECT_PERIOD_OPTIONS,
    period,
    handlePeriodChange,
    customRange: { from: customFrom, to: customTo },
    handleApplyCustomRange,
    summary: data,
    tiles,
    isLoading: summary.isPending,
    errorMessage: apiErrorMessage(summary.error),
  }
}
