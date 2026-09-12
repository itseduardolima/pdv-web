import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
  const [amountText, setAmountText] = useState('')

  const amountCents = parseMoneyInput(amountText)

  function handleSuggestion(cents: number) {
    open.reset()
    setAmountText(formatMoneyInput(cents))
  }

  function handleAmountChange(text: string) {
    open.reset()
    setAmountText(text)
  }

  // Sempre envia: a API valida o valor e responde a mensagem do campo.
  function handleSubmit() {
    open.mutate(
      { openingAmountCents: amountCents },
      {
        onSuccess: () => {
          router.push('/')
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
    isSubmitting: open.isPending,
    amountError: apiFieldErrors(open.error)?.openingAmountCents ?? null,
    errorMessage: apiGeneralErrorMessage(open.error),
    dismissError: open.reset,
  }
}
