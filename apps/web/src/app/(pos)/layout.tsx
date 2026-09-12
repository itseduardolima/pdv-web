import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { SessionProvider } from '@/components/providers/session-provider'
import { getCurrentSession } from '@/lib/session.server'

// Toda rota operacional exige operador logado. (A checagem de caixa aberto
// entra aqui na Sprint 3, ver docs/SPEC.md § Rotas.)
export default async function PosLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')
  return <SessionProvider session={session}>{children}</SessionProvider>
}
