import { headers } from 'next/headers'
import { TENANT_HOST_HEADER } from './api-client'

// Só para Server Components: repassa à API o host que o browser usou (tenant)
// e o cookie de sessão, que o fetch do servidor não envia sozinho.
export async function serverRequestHeaders(): Promise<Record<string, string>> {
  const incoming = await headers()
  const result: Record<string, string> = { [TENANT_HOST_HEADER]: incoming.get('host') ?? '' }
  const cookie = incoming.get('cookie')
  if (cookie) result.cookie = cookie
  return result
}
