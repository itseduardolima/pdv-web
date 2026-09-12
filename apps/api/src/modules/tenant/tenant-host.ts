// Normaliza o host de uma request e extrai o slug quando ele é subdomínio
// do domínio base da aplicação (ex.: karol.app.exemplo.com → "karol").
export interface ParsedTenantHost {
  host: string
  slug: string | null
}

export function parseTenantHost(rawHost: string, baseDomain: string): ParsedTenantHost {
  const host = rawHost.trim().toLowerCase().replace(/:\d+$/, '')
  const base = baseDomain.trim().toLowerCase().replace(/:\d+$/, '')

  if (!base || !host.endsWith(`.${base}`)) return { host, slug: null }

  const prefix = host.slice(0, -(base.length + 1))
  // Só um nível de subdomínio identifica tenant (a.b.base não é válido).
  if (!prefix || prefix.includes('.')) return { host, slug: null }

  return { host, slug: prefix }
}
