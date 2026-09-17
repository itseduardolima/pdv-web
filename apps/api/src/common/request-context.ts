import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestContext {
  requestId: string
}

// Mesmo mecanismo de tenant-context.ts, mas pro requestId (09-operacao § 3):
// gerado em RequestIdMiddleware, ANTES do TenantMiddleware — precisa valer
// até pra rotas fora do tenant (health, platform/*, docs).
export const requestStorage = new AsyncLocalStorage<RequestContext>()

export function getRequestId(): string | undefined {
  return requestStorage.getStore()?.requestId
}
