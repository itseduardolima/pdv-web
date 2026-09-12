import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { SessionProvider } from '@/components/providers/session-provider'
import { getCurrentSession } from '@/lib/session.server'
import { getCurrentTenant } from '@/lib/tenant.server'

// Toda rota operacional exige operador logado. O shell e a exigência de
// caixa aberto ficam em (operating); open-register fica fora dela.
export default async function PosLayout({ children }: { children: ReactNode }) {
  // Sem loja resolvida o layout raiz já mostra o erro; aqui não há o que fazer.
  const { tenant } = await getCurrentTenant()
  if (!tenant) return null

  const session = await getCurrentSession()
  if (!session) redirect('/login')
  return <SessionProvider session={session}>{children}</SessionProvider>
}
