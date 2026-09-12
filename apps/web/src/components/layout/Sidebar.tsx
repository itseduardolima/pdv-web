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

// md..lg: só ícones (tablet); lg+: ícone + rótulo (desktop).
export function Sidebar({ tenant, items, operatorName, operatorPhotoUrl, roleLabel, onLogout }: SidebarProps) {
  return (
    <aside className="hidden h-full w-[84px] shrink-0 flex-col items-center rounded-nav bg-surface px-0 py-5 shadow-nav md:flex lg:w-[236px] lg:items-stretch lg:px-4 lg:py-6">
      <div className="flex items-center gap-3 px-0 lg:px-1">
        <TenantMark tenant={tenant} />
        <span className="hidden truncate font-heading text-sm font-bold tracking-tight lg:block">{tenant.name}</span>
      </div>

      <nav aria-label="Principal" className="mt-7 flex flex-col gap-2 lg:gap-1.5">
        {items.map(({ key, href, label, icon: Icon, active }) => (
          <Link
            key={key}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex h-[46px] w-[46px] items-center justify-center rounded-frame font-body text-sm lg:w-full lg:justify-start lg:gap-3 lg:px-3.5 ${active ? 'bg-primary font-bold text-primary-ink' : 'font-medium text-ink'}`}
          >
            <Icon aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-center lg:gap-2.5 lg:px-1">
        <Avatar name={operatorName} photoUrl={operatorPhotoUrl} className="!h-[38px] !w-[38px] !text-xs" />
        <div className="hidden min-w-0 flex-1 lg:block">
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
