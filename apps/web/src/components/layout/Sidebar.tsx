import Link from 'next/link'
import type { PublicTenant } from '@pdv/shared'
import type { NavItem } from '@/lib/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronDownIcon, LogoutIcon } from '@/components/ui/Icons'
import { TenantMark } from './TenantMark'

interface SidebarProps {
  tenant: PublicTenant
  items: (NavItem & { active: boolean })[]
  operatorName: string
  operatorPhotoUrl: string | null
  roleLabel: string
  onLogout: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

// md+: sidebar (abaixo disso é bottom-nav, ver AppShell). Recolhida (só
// ícone) ou expandida (ícone + rótulo) por escolha do operador
// (`useSidebarCollapse`, persiste em localStorage) — desktop começa
// expandida, tablet começa recolhida, mas dá pra alternar dos dois lados.
export function Sidebar({
  tenant,
  items,
  operatorName,
  operatorPhotoUrl,
  roleLabel,
  onLogout,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`hidden h-full shrink-0 flex-col rounded-nav bg-surface py-5 shadow-nav transition-[width] md:flex ${
        collapsed ? 'w-[84px] items-center px-0' : 'w-[236px] items-stretch px-4 py-6'
      }`}
    >
      <div className={`flex w-full items-center gap-3 ${collapsed ? 'flex-col' : 'justify-between px-1'}`}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <TenantMark tenant={tenant} />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate font-heading text-sm font-bold tracking-tight">{tenant.name}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-frame text-ink/50 hover:bg-canvas hover:text-ink"
        >
          <ChevronDownIcon aria-hidden className={collapsed ? '-rotate-90' : 'rotate-90'} />
        </button>
      </div>

      <nav aria-label="Principal" className="mt-7 flex flex-col gap-2">
        {items.map(({ key, href, label, icon: Icon, active }) => (
          <Link
            key={key}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex h-[46px] items-center rounded-frame font-body text-sm ${
              collapsed ? 'w-[46px] justify-center' : 'w-full justify-start gap-3 px-3.5'
            } ${active ? 'bg-primary font-bold text-primary-ink' : 'font-medium text-ink'}`}
          >
            <Icon aria-hidden />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className={`flex items-center gap-2.5 ${collapsed ? 'flex-col' : 'px-1'}`}>
        <Avatar name={operatorName} photoUrl={operatorPhotoUrl} className="!h-[38px] !w-[38px] !text-xs" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-bold">{operatorName}</p>
            <p className="truncate font-body text-xs text-ink/50">{roleLabel}</p>
          </div>
        )}
        <button type="button" onClick={onLogout} aria-label="Sair" title="Sair" className="text-ink/60 hover:text-ink">
          <LogoutIcon aria-hidden />
        </button>
      </div>
    </aside>
  )
}
