import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { usePlatformLogin } from '@/hooks/queries/use-platform-login'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function usePlatformLoginPage() {
  const router = useRouter()
  const login = usePlatformLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sempre envia: a API é quem decide se e-mail/senha são válidos.
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push('/platform/tenants')
          router.refresh()
        },
      },
    )
  }

  return {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    isSubmitting: login.isPending,
    errorMessage: apiErrorMessage(login.error),
    dismissError: login.reset,
  }
}
