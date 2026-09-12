import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider } from '@/components/providers/session-provider'
import { getCurrentSession } from '@/lib/session.server'
import { getCurrentTenant } from '@/lib/tenant.server'

// Toda rota operacional exige operador logado. (A checagem de caixa aberto
// entra aqui na Sprint 3, ver docs/SPEC.md § Rotas.)
export default async function PosLayout({ children }: { children: ReactNode }) {
  // Sem loja resolvida o layout raiz já mostra o erro; aqui não há o que fazer.
  const { tenant } = await getCurrentTenant()
  if (!tenant) return null

  const session = await getCurrentSession()
  if (!session) redirect('/login')
  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  )
}
