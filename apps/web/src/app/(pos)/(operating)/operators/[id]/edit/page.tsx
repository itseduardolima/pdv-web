'use client'

import { OPERATOR_LIMITS } from '@pdv/shared'
import { PageHeader } from '@/components/layout/PageHeader'
import { OperatorForm } from '@/components/pos/OperatorForm'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TrashIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { useEditOperatorPage } from './use-edit-operator-page'

export default function EditOperatorPage() {
  const page = useEditOperatorPage()

  return (
    <>
      <PageHeader
        title="Editar Operador"
        subtitle={page.isLoading ? 'Carregando...' : page.operatorName}
        backHref="/operators"
        actions={
          !page.isLoading &&
          !page.loadErrorMessage && (
            <Button variant="ghost" size="sm" onClick={() => page.setConfirmingDelete(true)}>
              <TrashIcon aria-hidden />
              Excluir Operador
            </Button>
          )
        }
      />
      {page.loadErrorMessage ? (
        <InlineAlert>{page.loadErrorMessage}</InlineAlert>
      ) : (
        <>
          <OperatorForm
            form={page.form}
            withPin={false}
            onSubmit={page.handleSubmit}
            submitState={page.submitState}
            errorMessage={page.errorMessage}
            onDismissError={page.dismissError}
            onPhotoChange={page.handlePhotoChange}
            photoUploading={page.photoUploading}
            photoError={page.photoError}
          />

          <form
            onSubmit={page.handlePinSubmit}
            noValidate
            className="flex flex-col gap-3 rounded-card bg-surface p-4 md:p-[26px]"
          >
            <div>
              <h2 className="font-heading text-lg font-bold tracking-tight">Resetar PIN</h2>
              <p className="font-body text-xs text-ink/45 md:text-[13px]">
                Para quando o operador esquecer. O PIN antigo deixa de valer na hora.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="Novo PIN"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="••••"
                maxLength={OPERATOR_LIMITS.pinLength}
                name="newPin"
                value={page.newPin}
                onChange={page.handlePinChange}
                error={page.pinError ?? undefined}
                className="sm:w-[220px]"
              />
              <Button type="submit" variant="secondary" state={page.pinState} successLabel="PIN salvo">
                Salvar PIN
              </Button>
            </div>
          </form>
        </>
      )}
      <ConfirmDialog
        open={page.confirmingDelete}
        onOpenChange={page.setConfirmingDelete}
        title="Excluir operador?"
        description={`"${page.operatorName}" some da equipe e do Login. As vendas que já registrou continuam no histórico.`}
        confirmLabel="Excluir"
        onConfirm={page.handleDelete}
        confirmState={page.deleteState}
        destructive
      />
    </>
  )
}
