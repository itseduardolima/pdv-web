import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { TenantProvider } from '@/components/providers/tenant-provider'
import { ServerErrorNotice } from '@/components/ui/ServerErrorNotice'
import { isPlatformHost } from '@/lib/platform.server'
import { getCurrentTenant } from '@/lib/tenant.server'
import { tenantThemeVars } from '@/lib/tenant-theme'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  // Host do painel Superadmin (Épico 13): não tem tenant nenhum, não chama
  // GET /tenant/current (cairia em TENANT_NOT_FOUND à toa).
  if (await isPlatformHost()) return { title: 'Painel Superadmin' }

  const { tenant } = await getCurrentTenant()
  return {
    title: tenant?.name ?? 'PDV',
    // PWA instalável (HU 8.3, manifest.ts): com logo, o ícone do app/aba
    // passa a ser o do tenant; sem logo, cai no favicon.ico padrão da
    // plataforma (arquivo estático em app/, resolvido pelo Next sozinho).
    ...(tenant?.logoUrl ? { icons: { icon: tenant.logoUrl, apple: tenant.logoUrl } } : {}),
  }
}

export async function generateViewport(): Promise<Viewport> {
  if (await isPlatformHost()) return {}
  const { tenant } = await getCurrentTenant()
  return { themeColor: tenant?.primaryColor ?? '#e6e51e' }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Host do painel Superadmin: sem tema de tenant, sem TenantProvider — não
  // existe "a loja atual" aqui (ver docs/specs/01-arquitetura.md § Autenticação
  // de plataforma). Paleta cai no default de styles/theme.css.
  if (await isPlatformHost()) {
    return (
      <html lang="pt-BR">
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    )
  }

  const { tenant, error } = await getCurrentTenant()

  if (!tenant) {
    return (
      <html lang="pt-BR">
        <body>
          <ServerErrorNotice message={error.message} />
        </body>
      </html>
    )
  }

  return (
    <html lang="pt-BR" style={tenantThemeVars(tenant)}>
      <body>
        <QueryProvider>
          <TenantProvider tenant={tenant}>{children}</TenantProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
