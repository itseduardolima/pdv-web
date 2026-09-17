import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useChangePlatformAdminPassword } from '@/hooks/queries/use-change-platform-admin-password'
import { useUpdatePlatformAdmin } from '@/hooks/queries/use-update-platform-admin'
import { usePlatformSession } from '@/hooks/use-platform-session'
import { useSaveState } from '@/hooks/use-save-state'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'
import { apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

interface ProfileFormValues {
  name: string
  email: string
}

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
}

// Duas mutações independentes (nome/e-mail vs senha) — mesma razão de
// PATCH /operators/:id vs PATCH /operators/:id/pin serem endpoints
// separados: trocar senha tem regra de segurança diferente (confirmar o
// valor atual), não faz sentido no mesmo formulário/payload.
export function usePlatformAccountPage() {
  const admin = usePlatformSession()
  const router = useRouter()

  const updateProfile = useUpdatePlatformAdmin()
  const profileForm = useForm<ProfileFormValues>({ defaultValues: { name: admin.name, email: admin.email } })
  const profileSave = useSaveState(updateProfile.isPending)

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () => profileSave.markSaved(() => router.refresh()),
      onError: (error) => {
        const fieldErrors = apiFieldErrors(error)
        if (fieldErrors) {
          for (const [field, message] of Object.entries(fieldErrors)) {
            if (field === 'name' || field === 'email') profileForm.setError(field, { type: 'server', message })
          }
        }
      },
    })
  })

  const changePassword = useChangePlatformAdminPassword()
  const passwordForm = useForm<PasswordFormValues>({ defaultValues: { currentPassword: '', newPassword: '' } })
  const passwordSave = useSaveState(changePassword.isPending)

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        passwordForm.reset()
        passwordSave.markSaved(() => undefined)
      },
      onError: (error) => {
        const fieldErrors = apiFieldErrors(error)
        if (fieldErrors) {
          for (const [field, message] of Object.entries(fieldErrors)) {
            if (field === 'currentPassword' || field === 'newPassword') {
              passwordForm.setError(field, { type: 'server', message })
            }
          }
        }
      },
    })
  })

  return {
    profileForm,
    handleProfileSubmit,
    profileSubmitState: profileSave.state,
    profileErrorMessage: apiGeneralErrorMessage(updateProfile.error),
    dismissProfileError: updateProfile.reset,

    passwordForm,
    handlePasswordSubmit,
    passwordSubmitState: passwordSave.state,
    passwordErrorMessage: apiGeneralErrorMessage(changePassword.error),
    dismissPasswordError: changePassword.reset,
  }
}
