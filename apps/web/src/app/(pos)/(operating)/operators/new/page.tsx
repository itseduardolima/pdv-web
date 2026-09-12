'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { OperatorForm } from '@/components/pos/OperatorForm'
import { useNewOperatorPage } from './use-new-operator-page'

export default function NewOperatorPage() {
  const page = useNewOperatorPage()

  return (
    <>
      <PageHeader title="Novo Operador" subtitle="Dê acesso ao caixa a um funcionário" backHref="/operators" />
      <OperatorForm
        form={page.form}
        withPin
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
