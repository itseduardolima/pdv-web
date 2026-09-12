import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentCashSession } from '@/lib/cash-session.server'
import { getCurrentSession } from '@/lib/session.server'

// Já tem caixa aberto: não faz sentido abrir outro.
export default async function OpenRegisterLayout({ children }: { children: ReactNode }) {
  if (!(await getCurrentSession())) return null
  if (await getCurrentCashSession()) redirect('/')
  return children
}
