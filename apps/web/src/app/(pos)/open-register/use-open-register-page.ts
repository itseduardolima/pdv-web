import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCashSessionRegisters } from '@/hooks/queries/use-cash-session-registers'
import { useLogout } from '@/hooks/queries/use-logout'
import { useOpenCashSession } from '@/hooks/queries/use-open-cash-session'
import { useSession } from '@/hooks/use-session'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'
import { apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { formatMoneyInput, parseMoneyInput } from '@/lib/utils/money'

export const OPENING_AMOUNT_SUGGESTIONS_CENTS = [5000, 10000, 15000, 20000]

export function useOpenRegisterPage() {
  const router = useRouter()
  const { operator } = useSession()
  const open = useOpenCashSession()
  const logout = useLogout()
  const { data: registers, isPending: registersLoading } = useCashSessionRegisters()
  const [amountText, setAmountText] = useState('')
  const [registerNumber, setRegisterNumber] = useState<number | null>(null)

  const amountCents = parseMoneyInput(amountText)
  // HU 4.6: só existe seletor quando há mais de 1 caixa — tenant com
  // registerCount = 1 (padrão) nunca vê essa escolha.
  const showRegisterPicker = (registers?.length ?? 0) > 1
  const freeRegisters = registers?.filter((register) => !register.openedById) ?? null

  // Assim que a lista chega, pré-seleciona o único caixa livre (se houver só
  // 1) — o operador ainda pode trocar se houver mais de um livre.
  useEffect(() => {
    if (registerNumber !== null || !freeRegisters) return
    const [onlyFree] = freeRegisters
    if (freeRegisters.length === 1 && onlyFree) setRegisterNumber(onlyFree.registerNumber)
  }, [freeRegisters, registerNumber])

  function handleSuggestion(cents: number) {
    open.reset()
    setAmountText(formatMoneyInput(cents))
  }

  function handleAmountChange(text: string) {
    open.reset()
    setAmountText(text)
  }

  function handleSelectRegister(number: number) {
    open.reset()
    setRegisterNumber(number)
  }

  // Sem isso, o único jeito de trocar de operador era abrir um caixa (só
  // pra chegar na home e deslogar por lá) — e esse caixa ficava órfão,
  // dependendo de um Admin fechar depois (decisão de 2026-09-14).
  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/login')
        router.refresh()
      },
    })
  }

  // Sempre envia: a API valida o valor e responde a mensagem do campo.
  function handleSubmit() {
    open.mutate(
      { openingAmountCents: amountCents, registerNumber: registerNumber ?? undefined },
      {
        // Direto pra /sell (destino incondicional de '/' com caixa aberto,
        // (operating)/page.tsx) — evita o salto extra por '/' que, em
        // paralelo com este router.refresh(), corria o risco de deixar a
        // navegação parada bem no meio do caminho.
        onSuccess: () => {
          router.push('/sell')
          router.refresh()
        },
      },
    )
  }

  return {
    operatorName: operator.name,
    operatorPhotoUrl: operator.photoUrl,
    now: new Date(),
    amountText,
    selectedSuggestion: OPENING_AMOUNT_SUGGESTIONS_CENTS.find((cents) => cents === amountCents) ?? null,
    handleAmountChange,
    handleSuggestion,
    handleSubmit,
    handleLogout,
    isLoggingOut: logout.isPending,
    isSubmitting: open.isPending,
    amountError: apiFieldErrors(open.error)?.openingAmountCents ?? null,
    errorMessage: apiGeneralErrorMessage(open.error),
    dismissError: open.reset,
    showRegisterPicker,
    registers: registers ?? [],
    registerNumber,
    handleSelectRegister,
    registerError: apiFieldErrors(open.error)?.registerNumber ?? null,
    // Enquanto a lista de caixas ainda está carregando, não dá pra saber se
    // vai aparecer seletor — não deixa submeter (senão cai no default do
    // backend, registerNumber 1, sem o operador ter escolhido nada).
    canSubmit: !registersLoading && (!showRegisterPicker || registerNumber !== null),
  }
}
