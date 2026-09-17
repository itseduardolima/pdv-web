'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { DeletedOperatorCard } from '@/components/pos/DeletedOperatorCard'
import { OperatorCard } from '@/components/pos/OperatorCard'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader } from '@/components/ui/Loader'
import { useOperatorsPage } from './use-operators-page'

export default function OperatorsPage() {
  const page = useOperatorsPage()

  return (
    <>
      <PageHeader
        title="Operadores"
        subtitle={page.isLoading ? 'Carregando...' : `${page.operators.length} na equipe`}
        actions={
          <Button href="/operators/new" size="sm" className="w-full md:w-auto">
            <PlusIcon aria-hidden />
            Novo Operador
          </Button>
        }
      />

      {page.loadErrorMessage && <InlineAlert>{page.loadErrorMessage}</InlineAlert>}
      {page.actionErrorMessage && (
        <InlineAlert onDismiss={page.dismissActionError}>{page.actionErrorMessage}</InlineAlert>
      )}

      {page.isLoading && <Loader className="flex-1" />}

      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-4">
        {page.operators.map((operator) => (
          <OperatorCard
            key={operator.id}
            operator={operator}
            editHref={`/operators/${operator.id}/edit`}
            changingActive={page.changingId === operator.id}
            onActiveChange={(active) => page.handleActiveChange(operator.id, active)}
          />
        ))}
      </div>

      {!page.isLoading && !page.loadErrorMessage && page.operators.length === 0 && (
        <EmptyState title="Nenhum operador" description="Cadastre quem vai trabalhar no caixa." />
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <Button variant="ghost" size="sm" onClick={page.toggleShowDeleted} className="self-start">
          {page.showDeleted ? 'Ocultar operadores excluídos' : 'Ver operadores excluídos'}
        </Button>

        {page.showDeleted && (
          <>
            {page.deletedLoadErrorMessage && <InlineAlert>{page.deletedLoadErrorMessage}</InlineAlert>}
            {page.anonymizeErrorMessage && (
              <InlineAlert onDismiss={page.dismissAnonymizeError}>{page.anonymizeErrorMessage}</InlineAlert>
            )}
            {page.isLoadingDeleted && <Loader />}
            <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-4">
              {page.deletedOperators.map((operator) => (
                <DeletedOperatorCard
                  key={operator.id}
                  operator={operator}
                  anonymizing={page.anonymizingId === operator.id}
                  onAnonymize={() => page.setConfirmingAnonymizeId(operator.id)}
                />
              ))}
            </div>
            {!page.isLoadingDeleted && !page.deletedLoadErrorMessage && page.deletedOperators.length === 0 && (
              <p className="font-body text-sm text-ink/45">Nenhum operador excluído.</p>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={page.confirmingAnonymizeId !== null}
        onOpenChange={(open) => !open && page.setConfirmingAnonymizeId(null)}
        title="Remover os dados pessoais deste operador?"
        description="Nome e foto somem de vez — ação irreversível. As vendas que ele registrou continuam no histórico, só sem identificação pessoal."
        confirmLabel="Remover dados"
        destructive
        onConfirm={() => page.confirmingAnonymizeId && page.handleAnonymize(page.confirmingAnonymizeId)}
      />
    </>
  )
}
