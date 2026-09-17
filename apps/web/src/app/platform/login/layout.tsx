import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentPlatformAdmin } from '@/lib/platform-session.server'

// Quem já está logado não vê a tela de Login.
export default async function PlatformLoginLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentPlatformAdmin()
  if (admin) redirect('/platform/tenants')
  return children
}
