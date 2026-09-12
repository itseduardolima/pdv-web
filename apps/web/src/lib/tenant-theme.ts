import type { CSSProperties } from 'react'
import type { PublicTenant } from '@pdv/shared'

type ThemeTenant = Pick<PublicTenant, 'primaryColor' | 'primaryInkColor' | 'accentColor'>

// Tokens semânticos do tenant como CSS variables no <html>: sobrescrevem os
// defaults de styles/theme.css sem <style> injetado (que causava diferença
// de hidratação entre servidor e cliente).
export function tenantThemeVars(tenant: ThemeTenant): CSSProperties {
  return {
    '--color-primary': tenant.primaryColor,
    '--color-primary-ink': tenant.primaryInkColor,
    '--color-accent': tenant.accentColor,
  } as CSSProperties
}
