import { useSearchParams } from 'next/navigation'
import { usePinToken } from '@/hooks/queries/use-pin-token'
import { useSetPinWithToken } from '@/hooks/queries/use-set-pin-with-token'
import { usePinInput } from '@/hooks/use-pin-input'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function useSetPinPage() {
  const token = useSearchParams().get('token') ?? ''
  const info = usePinToken(token)
  const setPin = useSetPinWithToken()
  const pinInput = usePinInput()

  function handleDigit(digit: string) {
    setPin.reset()
    pinInput.append(digit)
  }

  // Sempre envia: a API valida o PIN e o link.
  function handleSubmit() {
    setPin.mutate({ token, pin: pinInput.pin }, { onError: () => pinInput.clear() })
  }

  return {
    operatorName: info.data?.operatorName ?? '',
    purpose: info.data?.purpose ?? null,
    isLoading: info.isPending,
    linkError: apiErrorMessage(info.error),
    pin: pinInput.pin,
    handleDigit,
    handleBackspace: pinInput.backspace,
    handleClear: pinInput.clear,
    handleSubmit,
    isSubmitting: setPin.isPending,
    done: setPin.isSuccess,
    errorMessage: apiErrorMessage(setPin.error),
    dismissError: setPin.reset,
  }
}
