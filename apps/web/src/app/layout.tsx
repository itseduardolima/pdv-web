import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { TenantProvider } from '@/components/providers/tenant-provider'
import { getCurrentTenant } from '@/lib/tenant.server'
import { tenantThemeVars } from '@/lib/tenant-theme'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
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
  const { tenant } = await getCurrentTenant()
  return { themeColor: tenant?.primaryColor ?? '#e6e51e' }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { tenant, error } = await getCurrentTenant()

  if (!tenant) {
    return (
      <html lang="pt-BR">
        <body>
          <main className="flex min-h-screen items-center justify-center p-6">
            <div className="max-w-md rounded-card bg-surface p-8 text-center">
              <h1 className="font-heading text-2xl font-bold tracking-tight">PDV</h1>
              <p className="mt-2 text-sm text-ink/60">{error.message}</p>
            </div>
          </main>
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
