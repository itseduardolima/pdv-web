'use client'

import { createContext, type ReactNode } from 'react'
import type { PublicTenant } from '@pdv/shared'

export const TenantContext = createContext<PublicTenant | null>(null)

export function TenantProvider({ tenant, children }: { tenant: PublicTenant; children: ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
}
