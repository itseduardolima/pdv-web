import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'PDV',
}

// Quando o módulo tenant existir na API, este layout resolve o tenant pelo host,
// injeta tenantThemeCss(tenant) num <style> e usa tenant.name no título.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
