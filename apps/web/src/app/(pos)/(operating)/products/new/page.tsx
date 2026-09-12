'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/pos/ProductForm'
import { useNewProductPage } from './use-new-product-page'

export default function NewProductPage() {
  const page = useNewProductPage()

  return (
    <>
      <PageHeader title="Novo Produto" subtitle="Cadastre um item para vender no caixa" backHref="/products" />
      <ProductForm
        form={page.form}
        categories={page.categories}
        onSubmit={page.handleSubmit}
        submitState={page.submitState}
        errorMessage={page.errorMessage}
        onDismissError={page.dismissError}
        onPhotoChange={page.handlePhotoChange}
        photoUploading={page.photoUploading}
        photoError={page.photoError}
      />
    </>
  )
}
