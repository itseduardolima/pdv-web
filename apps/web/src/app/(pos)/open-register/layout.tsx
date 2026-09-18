import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getMyCashSession } from '@/lib/cash-session.server'
import { getCurrentSession } from '@/lib/session.server'

// HU 4.7: "já tem caixa aberto" é sobre ESTE operador, não sobre o tenant —
// com múltiplos caixas, outro operador já estar num caixa aberto não pode
// impedir este de abrir o próprio (getCurrentCashSession, tenant-wide, é só
// pro guard de `(operating)/layout.tsx`, nunca pra decidir isso aqui).
export default async function OpenRegisterLayout({ children }: { children: ReactNode }) {
  if (!(await getCurrentSession())) redirect('/login')
  if (await getMyCashSession()) redirect('/')
  return children
}
