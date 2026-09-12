import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useProduct } from '@/hooks/queries/use-product'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { useUpdateProduct } from '@/hooks/queries/use-update-product'
import { formValuesToInput, productToFormValues, useProductForm } from '@/hooks/use-product-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useEditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const product = useProduct(id)
  const categories = useProductCategories()
  const update = useUpdateProduct(id)
  const { form, applyApiErrors } = useProductForm()
  const save = useSaveState(update.isPending)

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

  return {
    form,
    productName: product.data?.name ?? '',
    isLoading: product.isPending,
    loadErrorMessage: apiErrorMessage(product.error),
    categories: categories.data ?? [],
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(update.error),
    dismissError: update.reset,
  }
}
