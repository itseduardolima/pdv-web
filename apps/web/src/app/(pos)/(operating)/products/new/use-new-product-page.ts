import { useRouter } from 'next/navigation'
import { useCreateProduct } from '@/hooks/queries/use-create-product'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { useUploadImage } from '@/hooks/queries/use-upload-image'
import { formValuesToInput, useProductForm } from '@/hooks/use-product-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useNewProductPage() {
  const router = useRouter()
  const categories = useProductCategories()
  const create = useCreateProduct()
  const upload = useUploadImage('product')
  const { form, applyApiErrors } = useProductForm()
  const save = useSaveState(create.isPending)

  // Sempre envia: a API é quem valida e devolve o erro de cada campo.
  const handleSubmit = form.handleSubmit((values) => {
    create.mutate(formValuesToInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/products')),
      onError: (error) => applyApiErrors(error),
    })
  })

  function handlePhotoChange(file: File) {
    upload.mutate(file, { onSuccess: (url) => form.setValue('photoUrl', url, { shouldDirty: true }) })
  }

  return {
    form,
    categories: categories.data ?? [],
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(create.error),
    dismissError: create.reset,
    handlePhotoChange,
    photoUploading: upload.isPending,
    photoError: apiErrorMessage(upload.error),
  }
}
