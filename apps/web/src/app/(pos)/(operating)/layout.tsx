import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { getCurrentCashSession } from '@/lib/cash-session.server'
import { getCurrentSession } from '@/lib/session.server'

// 03-regras-negocio § Caixa / HU 4.2: sem caixa aberto, nada de vender,
// produtos, fechamento, dashboard ou operadores — vai para a Abertura.
export default async function OperatingLayout({ children }: { children: ReactNode }) {
  if (!(await getCurrentSession())) return null
  const cashSession = await getCurrentCashSession()
  if (!cashSession) redirect('/open-register')
  return <AppShell>{children}</AppShell>
}
