import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentSession } from '@/lib/session.server'
import { getCurrentTenant } from '@/lib/tenant.server'

// Quem já está logado não vê a tela de Login.
export default async function LoginLayout({ children }: { children: ReactNode }) {
  const { tenant } = await getCurrentTenant()
  if (!tenant) return null

  const session = await getCurrentSession()
  if (session) redirect('/')
  return children
}
