import { AsyncLocalStorage } from 'node:async_hooks'

export interface TenantContext {
  tenantId: string
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>()

export function getTenantId(): string {
  const context = tenantStorage.getStore()
  if (!context) throw new Error('Tenant not resolved for this request')
  return context.tenantId
}

// Implementado pelo módulo tenant; o middleware depende só desta abstração.
export abstract class TenantResolver {
  abstract resolveByHost(host: string): Promise<{ id: string } | null>
}
