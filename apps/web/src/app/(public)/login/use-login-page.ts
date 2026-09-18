import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLogin } from '@/hooks/queries/use-login'
import { useLoginOperators } from '@/hooks/queries/use-login-operators'
import { usePinInput } from '@/hooks/use-pin-input'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function useLoginPage() {
  const router = useRouter()
  const operators = useLoginOperators()
  const login = useLogin()
  const pinInput = usePinInput()
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null)

  function handleSelectOperator(operatorId: string) {
    setSelectedOperatorId(operatorId)
    login.reset()
  }

  function handleChangeOperator() {
    setSelectedOperatorId(null)
    pinInput.clear()
    login.reset()
  }

  function handleDigit(digit: string) {
    login.reset()
    pinInput.append(digit)
  }

  // Sempre envia: a API é quem decide se o PIN/operador é válido.
  function handleSubmit() {
    login.mutate(
      { operatorId: selectedOperatorId ?? '', pin: pinInput.pin },
      {
        onSuccess: () => {
          router.push('/')
          router.refresh()
        },
        onError: () => pinInput.clear(),
      },
    )
  }

  const selectedOperator = operators.data?.find((operator) => operator.id === selectedOperatorId) ?? null

  return {
    operators: operators.data ?? [],
    operatorsError: apiErrorMessage(operators.error),
    isLoadingOperators: operators.isPending,
    selectedOperatorId,
    selectedOperator,
    pin: pinInput.pin,
    isSubmitting: login.isPending,
    errorMessage: apiErrorMessage(login.error),
    handleSelectOperator,
    handleChangeOperator,
    handleDigit,
    handleBackspace: pinInput.backspace,
    handleClear: pinInput.clear,
    handleSubmit,
    dismissError: login.reset,
  }
}
