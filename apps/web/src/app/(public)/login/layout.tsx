import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentSession } from '@/lib/session.server'

// Quem já está logado não vê a tela de Login.
export default async function LoginLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession()
  if (session) redirect('/')
  return children
}
