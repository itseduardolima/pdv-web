import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { PlatformSessionProvider } from '@/components/providers/platform-session-provider'
import { getCurrentPlatformAdmin } from '@/lib/platform-session.server'

export default async function PlatformAccountLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentPlatformAdmin()
  if (!admin) redirect('/platform/login')
  return <PlatformSessionProvider admin={admin}>{children}</PlatformSessionProvider>
}
