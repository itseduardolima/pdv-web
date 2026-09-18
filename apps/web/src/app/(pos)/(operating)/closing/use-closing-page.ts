import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Sale } from '@pdv/shared'
import { useCashSession } from '@/hooks/queries/use-cash-session'
import { useCashSessionRegisters } from '@/hooks/queries/use-cash-session-registers'
import { useCashSessionSales } from '@/hooks/queries/use-cash-session-sales'
import { useCloseCashSession } from '@/hooks/queries/use-close-cash-session'
import { useCurrentCashSession } from '@/hooks/queries/use-current-cash-session'
import { useSaveState } from '@/hooks/use-save-state'
import { useSession } from '@/hooks/use-session'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { PAYMENT_METHODS, percentOf } from '@/lib/utils/payment-method'

export function useClosingPage() {
  const router = useRouter()
  const { operator } = useSession()
  const isAdmin = operator.role === 'ADMIN'
  const current = useCurrentCashSession() // "meu" caixa, se eu tiver um aberto
  const registers = useCashSessionRegisters()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  // HU 4.7: Administrador pode fechar QUALQUER caixa aberto, não só o
  // próprio — a lista mostra todos os abertos (o dele incluso, se tiver),
  // com o próprio pré-selecionado por padrão. Operador nunca vê essa lista.
  const openRegisters = isAdmin ? (registers.data ?? []).filter((r) => r.sessionId !== null) : []
  const myOwnSessionId = current.data?.id ?? null
  const defaultSessionId = myOwnSessionId ?? openRegisters[0]?.sessionId ?? null
  const activeSessionId = isAdmin ? (selectedSessionId ?? defaultSessionId) : myOwnSessionId
  const isViewingOwnSession = activeSessionId !== null && activeSessionId === myOwnSessionId

  const picked = useCashSession(isAdmin && !isViewingOwnSession ? (activeSessionId ?? undefined) : undefined)
  const session = isViewingOwnSession ? (current.data ?? null) : (picked.data ?? null)

  const sales = useCashSessionSales(session?.id)
  const close = useCloseCashSession(session?.id ?? '')
  const save = useSaveState(close.isPending)

  function handleSelectRegister(sessionId: string) {
    close.reset()
    setSelectedSessionId(sessionId)
  }

  // Fechando o PRÓPRIO caixa (fim do turno) manda pra Abertura, como sempre.
  // Fechando o caixa de OUTRA pessoa (Admin) fica em Fechamento, pra
  // continuar fechando os outros que ainda estiverem abertos.
  function handleClose() {
    const wasOwnSession = isViewingOwnSession
    close.mutate(undefined, {
      onSuccess: () =>
        save.markSaved(() => {
          if (wasOwnSession) {
            router.push('/open-register')
          } else {
            setSelectedSessionId(null)
          }
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

  const isLoading =
    current.isPending ||
    (isAdmin && registers.isPending) ||
    (isAdmin && !isViewingOwnSession && activeSessionId !== null && picked.isPending)

  return {
    session,
    isLoading,
    tiles,
    sales: sales.data ?? [],
    isLoadingSales: sales.isPending,
    handleClose,
    closeState: save.state,
    errorMessage:
      apiErrorMessage(current.error) ??
      apiErrorMessage(picked.error) ??
      apiErrorMessage(sales.error) ??
      apiErrorMessage(close.error),
    dismissError: close.reset,
    // Admin: seletor sempre que houver mais de 1 caixa aberto no tenant.
    showRegisterSwitcher: isAdmin && openRegisters.length > 1,
    openRegisters,
    activeSessionId,
    myOwnSessionId,
    handleSelectRegister,
    selectedSale,
    handleSelectSale: setSelectedSale,
    handleCloseSaleDetails: () => setSelectedSale(null),
  }
}
