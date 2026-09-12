import { useContext } from 'react'
import type { PublicTenant } from '@pdv/shared'
import { TenantContext } from '@/components/providers/tenant-provider'

// Tenant já resolvido no layout raiz — nome, logo e cores da loja atual.
export function useTenant(): PublicTenant {
  const tenant = useContext(TenantContext)
  if (!tenant) throw new Error('useTenant must be used inside TenantProvider')
  return tenant
}
