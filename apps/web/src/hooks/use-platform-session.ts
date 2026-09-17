import { useContext } from 'react'
import type { PlatformAdmin } from '@pdv/shared'
import { PlatformSessionContext } from '@/components/providers/platform-session-provider'

// Sessão já validada no layout (platform/tenants) — superadmin logado.
export function usePlatformSession(): PlatformAdmin {
  const admin = useContext(PlatformSessionContext)
  if (!admin) throw new Error('usePlatformSession must be used inside PlatformSessionProvider')
  return admin
}
