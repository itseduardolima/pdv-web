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

  // Formulário pré-preenchido, idêntico ao de criação (HU 3.3). Duas
  // precauções pro Select de Categoria (Radix) não "perder" o valor
  // carregado e voltar pro placeholder:
  // 1. Só reseta depois das categorias carregarem (senão a opção da
  //    categoria atual nem existe ainda pro Radix escolher).
  // 2. Mesmo com as categorias prontas, o <select> nativo escondido que o
  //    Radix usa por baixo ainda leva alguns ciclos de efeito pra terminar
  //    de registrar as <option> (fragmento off-DOM → portal → cada item se
  //    registra) — resetar na mesma passagem em que o campo monta arrisca
  //    setar o valor antes desse registro acabar, e o Radix devolve vazio.
  //    Um `setTimeout(0)` empurra o reset pra depois desse boot inicial.
  useEffect(() => {
    if (!product.data || categories.isPending) return
    const data = product.data
    const timer = setTimeout(() => form.reset(productToFormValues(data)), 0)
    return () => clearTimeout(timer)
  }, [product.data, categories.isPending, form])

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
    // Espera as categorias também: se o Select de Categoria montar antes
    // delas existirem, o <select> nativo escondido do Radix não tem as
    // <option> ainda quando o valor carregado chegar (ver comentário do
    // reset abaixo) — o formulário nunca mostraria a categoria certa.
    isLoading: product.isPending || categories.isPending,
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
