'use client'

import { TenantMark } from '@/components/layout/TenantMark'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTenant } from '@/hooks/use-tenant'

// Fora de qualquer route group (pos)/(public) — não tem AppShell nem
// SessionProvider, só o TenantProvider do layout raiz (nome/logo/cor da
// loja). "Voltar" manda pra "/", que já decide Vender ou Login pela sessão.
export default function NotFound() {
  const tenant = useTenant()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6">
      <TenantMark tenant={tenant} />
      <EmptyState
        title="Página não encontrada"
        description="O endereço digitado não existe ou não está mais disponível."
      />
      <Button href="/">Voltar ao início</Button>
    </main>
  )
}
