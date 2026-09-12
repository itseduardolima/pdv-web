'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/pos/ProductForm'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { useEditProductPage } from './use-edit-product-page'

export default function EditProductPage() {
  const page = useEditProductPage()

  return (
    <>
      <PageHeader title="Editar Produto" subtitle={page.isLoading ? 'Carregando...' : page.productName} backHref="/products" />
      {page.loadErrorMessage ? (
        <InlineAlert>{page.loadErrorMessage}</InlineAlert>
      ) : (
        <ProductForm
          form={page.form}
          categories={page.categories}
          onSubmit={page.handleSubmit}
          submitState={page.submitState}
          errorMessage={page.errorMessage}
          onDismissError={page.dismissError}
          cancelHref="/products"
        />
      )}
    </>
  )
}
