'use client'

import { createContext, type ReactNode } from 'react'
import type { CurrentSession } from '@pdv/shared'

export const SessionContext = createContext<CurrentSession | null>(null)

export function SessionProvider({ session, children }: { session: CurrentSession; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
