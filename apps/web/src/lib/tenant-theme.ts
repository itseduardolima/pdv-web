import type { PublicTenant } from '@pdv/shared'

export function tenantThemeCss(tenant: Pick<PublicTenant, 'primaryColor' | 'primaryInkColor' | 'accentColor'>): string {
  return `:root{--color-primary:${tenant.primaryColor};--color-primary-ink:${tenant.primaryInkColor};--color-accent:${tenant.accentColor};}`
}
