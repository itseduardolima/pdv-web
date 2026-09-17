'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { PlatformShell } from '@/components/platform/PlatformShell'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { OperatorsIcon, PlusIcon, ProductsIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader } from '@/components/ui/Loader'
import { SearchBar } from '@/components/ui/SearchBar'
import { env } from '@/lib/env'
import { initials } from '@/lib/utils/initials'
import { usePlatformTenantsPage } from './use-platform-tenants-page'

export default function PlatformTenantsPage() {
  const page = usePlatformTenantsPage()

  return (
    <PlatformShell>
      <PageHeader
        title="Lojas"
        subtitle={page.isLoadingTenants ? 'Carregando...' : `${page.kpis.totalTenants} lojas cadastradas no sistema`}
        actions={
          <Button href="/platform/tenants/new" size="sm" className="w-full md:w-auto">
            <PlusIcon aria-hidden />
            Nova Loja
          </Button>
        }
      />

      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-frame bg-accent text-surface">
            <ProductsIcon aria-hidden width={16} height={16} />
          </div>
          <div className="font-heading text-2xl font-bold tracking-tight">{page.kpis.totalTenants}</div>
          <div className="font-body text-xs font-medium text-ink/50">Total de lojas</div>
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-frame bg-[#ff8562] text-surface">
            <OperatorsIcon aria-hidden width={16} height={16} />
          </div>
          <div className="font-heading text-2xl font-bold tracking-tight">{page.kpis.totalOperators}</div>
          <div className="font-body text-xs font-medium text-ink/50">Operadores no sistema</div>
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-frame bg-primary text-primary-ink">
            <PlusIcon aria-hidden width={16} height={16} />
          </div>
          <div className="font-heading text-2xl font-bold tracking-tight">{page.kpis.newLast30Days}</div>
          <div className="font-body text-xs font-medium text-ink/50">Novas (30 dias)</div>
        </div>
      </div>

      <SearchBar
        placeholder="Buscar loja por nome ou identificador"
        value={page.search}
        onChange={(event) => page.setSearch(event.target.value)}
      />

      {page.tenantsErrorMessage && <InlineAlert>{page.tenantsErrorMessage}</InlineAlert>}
      {page.isLoadingTenants && <Loader />}

      {!page.isLoadingTenants && !page.tenantsErrorMessage && !page.hasAnyTenants && (
        <EmptyState title="Nenhuma loja ainda" description="Crie a primeira loja pelo botão acima." />
      )}

      {!page.isLoadingTenants && page.hasAnyTenants && page.tenants.length === 0 && (
        <EmptyState title="Nenhuma loja encontrada" description="Tente outro nome ou identificador." />
      )}

      <div className="flex flex-col gap-2.5">
        {page.hasAnyTenants && (
          <div className="hidden px-4 font-body text-[11px] font-semibold uppercase tracking-wide text-ink/40 sm:grid sm:grid-cols-[minmax(0,1fr)_84px_96px_112px_120px] sm:gap-4">
            <span>Loja</span>
            <span>Status</span>
            <span>Operadores</span>
            <span className="justify-self-center">Desde</span>
            <span className="justify-self-center">Ação</span>
          </div>
        )}

        {page.tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="grid grid-cols-1 gap-3 rounded-card bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_84px_96px_112px_120px] sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-frame bg-accent font-heading text-sm font-bold text-surface">
                {initials(tenant.name)}
              </div>
              <div className="min-w-0">
                <span className="block truncate font-heading text-[15px] font-bold tracking-tight">{tenant.name}</span>
                <span className="block truncate font-body text-xs text-ink/45">
                  {tenant.domain ?? `${tenant.slug}.${env.appBaseDomain}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:contents">
              <span
                className={`w-fit shrink-0 rounded-pill px-2.5 py-1 font-body text-[11px] font-semibold sm:justify-self-start ${
                  tenant.active ? 'bg-canvas text-ink/50' : 'bg-danger/15 text-danger'
                }`}
              >
                {tenant.active ? 'Ativa' : 'Suspensa'}
              </span>
              <span className="flex items-center gap-1.5 rounded-pill bg-canvas px-3 py-1.5 font-body text-xs font-semibold text-ink sm:justify-self-start">
                <OperatorsIcon aria-hidden width={13} height={13} />
                {tenant.activeOperatorCount}
              </span>
              <span className="font-body text-xs text-ink/45 sm:justify-self-center">
                desde {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
              </span>
              {tenant.active ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => page.askSuspend({ id: tenant.id, name: tenant.name })}
                  className="ml-auto w-auto justify-center !border-danger !text-danger sm:ml-0 sm:w-full sm:justify-self-center"
                >
                  Suspender
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => page.handleReactivate(tenant.id)}
                  state={page.reactivatingId === tenant.id ? 'loading' : 'idle'}
                  className="ml-auto w-auto justify-center sm:ml-0 sm:w-full sm:justify-self-center"
                >
                  Reativar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {page.hasAnyTenants && page.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={page.goPrev} disabled={!page.canGoPrev}>
            Anterior
          </Button>
          <span className="font-body text-xs text-ink/50">
            Página {page.page} de {page.totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={page.goNext} disabled={!page.canGoNext}>
            Próxima
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={page.confirmingSuspend !== null}
        onOpenChange={(open) => !open && page.cancelSuspend()}
        title="Suspender loja?"
        description={`"${page.confirmingSuspend?.name}" perde acesso ao sistema até ser reativada. Nenhum dado é apagado.`}
        confirmLabel="Suspender"
        onConfirm={page.handleConfirmSuspend}
        confirmState={page.suspendState}
        destructive
      />
    </PlatformShell>
  )
}
