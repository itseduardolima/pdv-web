import Link from 'next/link'
import type { PublicTenant } from '@pdv/shared'
import type { NavItem } from '@/lib/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { LogoutIcon } from '@/components/ui/Icons'
import { TenantMark } from './TenantMark'

interface SidebarProps {
  tenant: PublicTenant
  items: (NavItem & { active: boolean })[]
  operatorName: string
  operatorPhotoUrl: string | null
  roleLabel: string
  onLogout: () => void
}

// md..xl: só ícones (tablet, retrato ou paisagem); xl+: ícone + rótulo
// (desktop) — iPad deitado passa de 1024px mas ainda não é desktop
// (decisão de 2026-09-13, mesmo limite da SplitAuthLayout).
export function Sidebar({ tenant, items, operatorName, operatorPhotoUrl, roleLabel, onLogout }: SidebarProps) {
  return (
    <aside className="hidden h-full w-[84px] shrink-0 flex-col items-center rounded-nav bg-surface px-0 py-5 shadow-nav md:flex xl:w-[236px] xl:items-stretch xl:px-4 xl:py-6">
      <div className="flex items-center gap-3 px-0 xl:px-1">
        <TenantMark tenant={tenant} />
        <span className="hidden truncate font-heading text-sm font-bold tracking-tight xl:block">{tenant.name}</span>
      </div>

      <nav aria-label="Principal" className="mt-7 flex flex-col gap-2 xl:gap-1.5">
        {items.map(({ key, href, label, icon: Icon, active }) => (
          <Link
            key={key}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex h-[46px] w-[46px] items-center justify-center rounded-frame font-body text-sm xl:w-full xl:justify-start xl:gap-3 xl:px-3.5 ${active ? 'bg-primary font-bold text-primary-ink' : 'font-medium text-ink'}`}
          >
            <Icon aria-hidden />
            <span className="hidden xl:inline">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-3 xl:flex-row xl:items-center xl:gap-2.5 xl:px-1">
        <Avatar name={operatorName} photoUrl={operatorPhotoUrl} className="!h-[38px] !w-[38px] !text-xs" />
        <div className="hidden min-w-0 flex-1 xl:block">
          <p className="truncate font-body text-sm font-bold">{operatorName}</p>
          <p className="truncate font-body text-xs text-ink/50">{roleLabel}</p>
        </div>
        <button type="button" onClick={onLogout} aria-label="Sair" title="Sair" className="text-ink/60 hover:text-ink">
          <LogoutIcon aria-hidden />
        </button>
      </div>
    </aside>
  )
}
