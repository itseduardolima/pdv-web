import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { QueryProvider } from '@/components/providers/query-provider'
import { TenantProvider } from '@/components/providers/tenant-provider'
import { getCurrentTenant } from '@/lib/tenant.server'
import { tenantThemeCss } from '@/lib/tenant-theme'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const { tenant } = await getCurrentTenant()
  return { title: tenant?.name ?? 'PDV' }
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
    <html lang="pt-BR">
      <head>
        <style dangerouslySetInnerHTML={{ __html: tenantThemeCss(tenant) }} />
      </head>
      <body>
        <QueryProvider>
          <TenantProvider tenant={tenant}>{children}</TenantProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
