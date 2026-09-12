import { useRouter } from 'next/navigation'
import { useCashSessionSales } from '@/hooks/queries/use-cash-session-sales'
import { useCloseCashSession } from '@/hooks/queries/use-close-cash-session'
import { useCurrentCashSession } from '@/hooks/queries/use-current-cash-session'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { PAYMENT_METHODS, percentOf } from '@/lib/utils/payment-method'

export function useClosingPage() {
  const router = useRouter()
  const current = useCurrentCashSession()
  const session = current.data ?? null
  const sales = useCashSessionSales(session?.id)
  const close = useCloseCashSession(session?.id ?? '')
  const save = useSaveState(close.isPending)

  function handleClose() {
    close.mutate(undefined, {
      onSuccess: () =>
        save.markSaved(() => {
          router.push('/open-register')
          router.refresh()
        }),
    })
  }

  const tiles = session
    ? PAYMENT_METHODS.map((method) => ({
        method,
        cents: session.totals[method],
        percent: percentOf(session.totals[method], session.totalCents),
      }))
    : []

  return {
    session,
    isLoading: current.isPending,
    tiles,
    sales: sales.data ?? [],
    isLoadingSales: sales.isPending,
    handleClose,
    closeState: save.state,
    errorMessage: apiErrorMessage(current.error) ?? apiErrorMessage(sales.error) ?? apiErrorMessage(close.error),
    dismissError: close.reset,
  }
}
