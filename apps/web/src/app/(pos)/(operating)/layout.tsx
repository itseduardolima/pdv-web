import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { getCurrentCashSession, getMyCashSession } from '@/lib/cash-session.server'
import { getCurrentSession } from '@/lib/session.server'

// 03-regras-negocio § Caixa / HU 4.2: sem caixa aberto, nada de vender,
// produtos, fechamento, dashboard ou operadores — vai para a Abertura.
//
// HU 4.7 (múltiplos caixas): um Operador só passa se ELE mesmo tiver um
// caixa aberto (senão nunca seria levado pra Abertura — outro operador já
// ter aberto o dele não pode "esconder" essa tela). Um Administrador ainda
// pode entrar sem ter aberto nenhum, desde que a loja esteja operando
// (algum caixa aberto por qualquer um) — é o que sustenta o Admin fechar o
// caixa de outra pessoa ou só olhar o Dashboard sem operar um caixa.
export default async function OperatingLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession()
  if (!session) return null
  const mine = await getMyCashSession()
  if (mine) return <AppShell>{children}</AppShell>
  if (session.operator.role === 'ADMIN' && (await getCurrentCashSession())) return <AppShell>{children}</AppShell>
  redirect('/open-register')
}
