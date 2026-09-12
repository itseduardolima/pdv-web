import type { PublicTenant } from '@pdv/shared'

// Logo do tenant ou a inicial do nome sobre a cor primária. Nunca uma marca fixa.
export function TenantMark({ tenant, className = '' }: { tenant: PublicTenant; className?: string }) {
  const base = `flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-frame ${className}`
  if (tenant.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- logo do tenant, domínio dinâmico
    return <img src={tenant.logoUrl} alt="" className={`${base} object-cover`} />
  }
  return (
    <span aria-hidden className={`${base} bg-primary font-heading text-xl font-bold text-primary-ink`}>
      {tenant.name.charAt(0)}
    </span>
  )
}
