import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUpdateTenant } from '@/hooks/queries/use-update-tenant'
import { useUploadImage } from '@/hooks/queries/use-upload-image'
import { formValuesToUpdateInput, tenantToFormValues, useTenantSettingsForm } from '@/hooks/use-tenant-settings-form'
import { useSaveState } from '@/hooks/use-save-state'
import { useTenant } from '@/hooks/use-tenant'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useSettingsPage() {
  const tenant = useTenant()
  const router = useRouter()
  const update = useUpdateTenant()
  const upload = useUploadImage('tenant-logo')
  const { form, applyApiErrors } = useTenantSettingsForm(tenantToFormValues(tenant))
  const save = useSaveState(update.isPending)

  // Se o tenant mudar por fora (ex.: router.refresh após salvar), reflete no form.
  useEffect(() => form.reset(tenantToFormValues(tenant)), [tenant, form])

  const handleSubmit = form.handleSubmit((values) => {
    update.mutate(formValuesToUpdateInput(values), {
      onSuccess: () => save.markSaved(() => router.refresh()),
      onError: (error) => applyApiErrors(error),
    })
  })

  function handleLogoChange(file: File) {
    upload.mutate(file, { onSuccess: (url) => form.setValue('logoUrl', url, { shouldDirty: true }) })
  }

  return {
    form,
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(update.error),
    dismissError: update.reset,
    handleLogoChange,
    logoUploading: upload.isPending,
    logoError: apiErrorMessage(upload.error),
  }
}
