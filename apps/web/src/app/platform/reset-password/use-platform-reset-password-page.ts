import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePlatformResetPassword } from '@/hooks/queries/use-platform-reset-password'
import { usePlatformResetToken } from '@/hooks/queries/use-platform-reset-token'
import { apiErrorMessage } from '@/lib/utils/api-error-message'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

export function usePlatformResetPasswordPage() {
  const token = useSearchParams().get('token') ?? ''
  const info = usePlatformResetToken(token)
  const resetPassword = usePlatformResetPassword()
  const [newPassword, setNewPassword] = useState('')

  function handlePasswordChange(value: string) {
    resetPassword.reset()
    setNewPassword(value)
  }

  // Sempre envia: a API valida a senha e o link.
  function handleSubmit() {
    resetPassword.mutate({ token, newPassword })
  }

  return {
    adminName: info.data?.adminName ?? '',
    isLoading: info.isPending,
    linkError: apiErrorMessage(info.error),
    newPassword,
    handlePasswordChange,
    passwordError: apiFieldErrors(resetPassword.error)?.newPassword ?? null,
    handleSubmit,
    isSubmitting: resetPassword.isPending,
    done: resetPassword.isSuccess,
    errorMessage: apiFieldErrors(resetPassword.error) ? null : apiErrorMessage(resetPassword.error),
    dismissError: resetPassword.reset,
  }
}
