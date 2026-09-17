import { useState } from 'react'
import { PLATFORM_TENANT_PAGE_LIMITS } from '@pdv/shared'
import type { ButtonState } from '@/components/ui/Button'
import { usePlatformTenants } from '@/hooks/queries/use-platform-tenants'
import { useSetTenantActive } from '@/hooks/queries/use-set-tenant-active'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

interface SuspendTarget {
  id: string
  name: string
}

export function usePlatformTenantsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmingSuspend, setConfirmingSuspend] = useState<SuspendTarget | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const setActive = useSetTenantActive()

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  const tenants = usePlatformTenants({
    page,
    pageSize: PLATFORM_TENANT_PAGE_LIMITS.pageSize.default,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
  })

  const data = tenants.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  // Suspender pede confirmação (bloqueia acesso de gente de verdade) —
  // reativar é o caminho de "desfazer", roda direto sem diálogo.
  function handleReactivate(id: string) {
    setActive.mutate({ id, active: true })
  }
  function handleConfirmSuspend() {
    if (!confirmingSuspend) return
    setActive.mutate({ id: confirmingSuspend.id, active: false }, { onSuccess: () => setConfirmingSuspend(null) })
  }

  const suspendState: ButtonState = setActive.isPending && confirmingSuspend ? 'loading' : 'idle'

  return {
    tenants: data?.items ?? [],
    hasAnyTenants: (data?.total ?? 0) > 0,
    isLoadingTenants: tenants.isPending,
    tenantsErrorMessage: apiErrorMessage(tenants.error),
    search,
    setSearch: handleSearchChange,
    kpis: {
      totalTenants: data?.total ?? 0,
      totalOperators: data?.totalOperators ?? 0,
      newLast30Days: data?.newLast30Days ?? 0,
    },
    page,
    totalPages,
    canGoPrev: page > 1,
    canGoNext: page < totalPages,
    goPrev: () => setPage((current) => Math.max(1, current - 1)),
    goNext: () => setPage((current) => Math.min(totalPages, current + 1)),
    confirmingSuspend,
    askSuspend: (target: SuspendTarget) => setConfirmingSuspend(target),
    cancelSuspend: () => setConfirmingSuspend(null),
    handleConfirmSuspend,
    suspendState,
    handleReactivate,
    reactivatingId: setActive.isPending && !confirmingSuspend ? setActive.variables?.id : undefined,
  }
}
