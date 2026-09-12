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
      />
      {page.loadErrorMessage ? (
        <InlineAlert>{page.loadErrorMessage}</InlineAlert>
      ) : (
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
          after={
            <form
              onSubmit={page.handlePinSubmit}
              noValidate
              className="flex h-full flex-col gap-3 rounded-card bg-surface p-4 md:p-[26px]"
            >
              <div>
                <h2 className="font-heading text-lg font-bold tracking-tight">Resetar PIN</h2>
                <p className="font-body text-xs text-ink/45 md:text-[13px]">
                  Para quando o operador esquecer. O PIN antigo deixa de valer na hora.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                {/* mt alinha o botão com o campo, não com o rótulo acima dele */}
                <Button
                  type="submit"
                  variant="secondary"
                  state={page.pinState}
                  successLabel="PIN salvo"
                  className="sm:mt-[26px]"
                >
                  Salvar PIN
                </Button>
              </div>
            </form>
          }
          asideExtra={
            <section className="flex h-full flex-col gap-3 rounded-card bg-surface p-4 md:p-[22px]">
              <div>
                <h2 className="font-heading text-base font-bold tracking-tight">Zona de risco</h2>
                <p className="font-body text-xs text-ink/45">
                  Some da equipe e do Login. As vendas já feitas ficam no histórico.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => page.setConfirmingDelete(true)}
                className="mt-auto w-full !border-danger !text-danger"
              >
                <TrashIcon aria-hidden />
                Excluir Operador
              </Button>
            </section>
          }
        />
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
