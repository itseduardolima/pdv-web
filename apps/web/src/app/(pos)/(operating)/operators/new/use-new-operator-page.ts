import { useRouter } from 'next/navigation'
import { useCreateOperator } from '@/hooks/queries/use-create-operator'
import { useUploadImage } from '@/hooks/queries/use-upload-image'
import { formValuesToCreateInput, useOperatorForm } from '@/hooks/use-operator-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useNewOperatorPage() {
  const router = useRouter()
  const create = useCreateOperator()
  const upload = useUploadImage('operator')
  const { form, applyApiErrors } = useOperatorForm()
  const save = useSaveState(create.isPending)

  // Sempre envia: a API valida nome, papel e PIN e devolve o erro por campo.
  const handleSubmit = form.handleSubmit((values) => {
    create.mutate(formValuesToCreateInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/operators')),
      onError: (error) => applyApiErrors(error),
    })
  })

  function handlePhotoChange(file: File) {
    upload.mutate(file, { onSuccess: (url) => form.setValue('photoUrl', url, { shouldDirty: true }) })
  }

  return {
    form,
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(create.error),
    dismissError: create.reset,
    handlePhotoChange,
    photoUploading: upload.isPending,
    photoError: apiErrorMessage(upload.error),
  }
}
