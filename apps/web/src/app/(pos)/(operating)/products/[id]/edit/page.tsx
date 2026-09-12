'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/components/pos/ProductForm'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TrashIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { useEditProductPage } from './use-edit-product-page'

export default function EditProductPage() {
  const page = useEditProductPage()

  return (
    <>
      <PageHeader
        title="Editar Produto"
        subtitle={page.isLoading ? 'Carregando...' : page.productName}
        backHref="/products"
        actions={
          !page.isLoading &&
          !page.loadErrorMessage && (
            <Button variant="ghost" size="sm" onClick={() => page.setConfirmingDelete(true)}>
              <TrashIcon aria-hidden />
              Excluir Produto
            </Button>
          )
        }
      />
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
          onPhotoChange={page.handlePhotoChange}
          photoUploading={page.photoUploading}
          photoError={page.photoError}
        />
      )}
      <ConfirmDialog
        open={page.confirmingDelete}
        onOpenChange={page.setConfirmingDelete}
        title="Excluir produto?"
        description={`"${page.productName}" some da lista e da tela de venda. As vendas já feitas continuam no histórico.`}
        confirmLabel="Excluir"
        onConfirm={page.handleDelete}
        confirmState={page.deleteState}
        destructive
      />
    </>
  )
}
