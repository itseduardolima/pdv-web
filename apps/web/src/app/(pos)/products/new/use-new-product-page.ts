import { useRouter } from 'next/navigation'
import { useCreateProduct } from '@/hooks/queries/use-create-product'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { formValuesToInput, useProductForm } from '@/hooks/use-product-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiGeneralErrorMessage } from '@/lib/utils/api-error-message'

export function useNewProductPage() {
  const router = useRouter()
  const categories = useProductCategories()
  const create = useCreateProduct()
  const { form, applyApiErrors } = useProductForm()
  const save = useSaveState(create.isPending)

  // Sempre envia: a API é quem valida e devolve o erro de cada campo.
  const handleSubmit = form.handleSubmit((values) => {
    create.mutate(formValuesToInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/products')),
      onError: (error) => applyApiErrors(error),
    })
  })

  return {
    form,
    categories: categories.data ?? [],
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(create.error),
    dismissError: create.reset,
  }
}
