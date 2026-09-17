import { useState, type ChangeEvent, type FormEvent } from 'react'
import { usePlatformForgotPassword } from '@/hooks/queries/use-platform-forgot-password'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

export function usePlatformForgotPasswordPage() {
  const forgot = usePlatformForgotPassword()
  const [email, setEmail] = useState('')

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    forgot.reset()
    setEmail(event.target.value)
  }

  // Sempre envia: a API valida o e-mail e responde igual exista ou não.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    forgot.mutate({ email })
  }

  return {
    email,
    handleEmailChange,
    handleSubmit,
    isSubmitting: forgot.isPending,
    sent: forgot.isSuccess,
    emailError: apiFieldErrors(forgot.error)?.email ?? null,
    errorMessage: apiFieldErrors(forgot.error) ? null : apiErrorMessage(forgot.error),
    dismissError: forgot.reset,
  }
}
