'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { OperatorCard } from '@/components/pos/OperatorCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
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
    </>
  )
}
