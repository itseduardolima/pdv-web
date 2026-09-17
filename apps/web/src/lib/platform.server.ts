import { headers } from 'next/headers'
import { env } from './env'

// Só para Server Components: o host reservado do painel Superadmin
// (Épico 13) não tem tenant nenhum — RootLayout usa isso pra pular
// getCurrentTenant()/tenantThemeVars por completo nesse host.
export async function isPlatformHost(): Promise<boolean> {
  const incoming = await headers()
  const host = (incoming.get('host') ?? '').toLowerCase().split(':')[0]
  return host === env.platformHost.toLowerCase()
}
