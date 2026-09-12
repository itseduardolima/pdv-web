import { useContext } from 'react'
import type { CurrentSession } from '@pdv/shared'
import { SessionContext } from '@/components/providers/session-provider'

// Sessão já validada no layout (pos) — operador logado e papel.
export function useSession(): CurrentSession {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}
