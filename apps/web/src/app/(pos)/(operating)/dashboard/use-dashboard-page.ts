import { useDashboardSummary } from '@/hooks/queries/use-dashboard-summary'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { PAYMENT_METHODS, percentOf } from '@/lib/utils/payment-method'

export function useDashboardPage() {
  const summary = useDashboardSummary()
  const data = summary.data ?? null

  const tiles = data
    ? PAYMENT_METHODS.map((method) => ({
        method,
        cents: data.today.byPaymentMethod[method] ?? 0,
        percent: percentOf(data.today.byPaymentMethod[method] ?? 0, data.today.totalCents),
      }))
    : []

  return {
    summary: data,
    tiles,
    isLoading: summary.isPending,
    errorMessage: apiErrorMessage(summary.error),
  }
}
