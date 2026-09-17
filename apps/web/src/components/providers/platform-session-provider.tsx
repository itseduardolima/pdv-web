'use client'

import { createContext, type ReactNode } from 'react'
import type { PlatformAdmin } from '@pdv/shared'

export const PlatformSessionContext = createContext<PlatformAdmin | null>(null)

export function PlatformSessionProvider({ admin, children }: { admin: PlatformAdmin; children: ReactNode }) {
  return <PlatformSessionContext.Provider value={admin}>{children}</PlatformSessionContext.Provider>
}
