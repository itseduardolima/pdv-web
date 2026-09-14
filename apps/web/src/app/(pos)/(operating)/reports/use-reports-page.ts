import { useState } from 'react'
import type { ReportPeriod } from '@pdv/shared'
import { useReportsSummary } from '@/hooks/queries/use-reports-summary'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { PAYMENT_METHODS, percentOf } from '@/lib/utils/payment-method'

export const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'custom', label: 'Personalizado' },
]

export function useReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const summary = useReportsSummary({
    period,
    from: period === 'custom' ? customFrom || undefined : undefined,
    to: period === 'custom' ? customTo || undefined : undefined,
  })
  const data = summary.data ?? null

  function handlePeriodChange(next: ReportPeriod) {
    setPeriod(next)
  }

  const tiles = data
    ? PAYMENT_METHODS.map((method) => ({
        method,
        cents: data.byPaymentMethod[method] ?? 0,
        percent: percentOf(data.byPaymentMethod[method] ?? 0, data.totalCents),
      }))
    : []

  return {
    periodOptions: PERIOD_OPTIONS,
    period,
    handlePeriodChange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    summary: data,
    tiles,
    isLoading: summary.isPending,
    errorMessage: apiErrorMessage(summary.error),
  }
}
