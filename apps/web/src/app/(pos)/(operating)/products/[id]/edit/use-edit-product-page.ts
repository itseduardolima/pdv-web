import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDeleteProduct } from '@/hooks/queries/use-delete-product'
import { useProduct } from '@/hooks/queries/use-product'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { useUpdateProduct } from '@/hooks/queries/use-update-product'
import { useUploadImage } from '@/hooks/queries/use-upload-image'
import { formValuesToInput, productToFormValues, useProductForm } from '@/hooks/use-product-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useEditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const product = useProduct(id)
  const categories = useProductCategories()
  const update = useUpdateProduct(id)
  const remove = useDeleteProduct(id)
  const upload = useUploadImage('product')
  const { form, applyApiErrors } = useProductForm()
  const save = useSaveState(update.isPending)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Formulário pré-preenchido, idêntico ao de criação (HU 3.3).
  useEffect(() => {
    if (product.data) form.reset(productToFormValues(product.data))
  }, [product.data, form])

  const handleSubmit = form.handleSubmit((values) => {
    update.mutate(formValuesToInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/products')),
      onError: (error) => applyApiErrors(error),
    })
  })

  function handlePhotoChange(file: File) {
    upload.mutate(file, { onSuccess: (url) => form.setValue('photoUrl', url, { shouldDirty: true }) })
  }

  function handleDelete() {
    remove.mutate(undefined, { onSuccess: () => router.push('/products') })
  }

  return {
    form,
    productName: product.data?.name ?? '',
    isLoading: product.isPending,
    loadErrorMessage: apiErrorMessage(product.error),
    categories: categories.data ?? [],
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(update.error) ?? apiErrorMessage(remove.error),
    dismissError: () => {
      update.reset()
      remove.reset()
    },
    handlePhotoChange,
    photoUploading: upload.isPending,
    photoError: apiErrorMessage(upload.error),
    confirmingDelete,
    setConfirmingDelete,
    handleDelete,
    deleteState: remove.isPending ? ('loading' as const) : ('idle' as const),
  }
}
