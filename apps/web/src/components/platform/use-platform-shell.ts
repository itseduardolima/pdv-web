import { usePathname, useRouter } from 'next/navigation'
import type { PublicTenant } from '@pdv/shared'
import { usePlatformLogout } from '@/hooks/queries/use-platform-logout'
import { usePlatformSession } from '@/hooks/use-platform-session'
import { useSidebarCollapse } from '@/hooks/use-sidebar-collapse'
import { ProductsIcon, SettingsIcon } from '@/components/ui/Icons'
import { isNavItemActive, type NavItem } from '@/lib/navigation'

// Sidebar/BottomNav (components/layout) pedem um PublicTenant pra montar a
// marca (TenantMark: logo ou inicial sobre bg-primary) — o painel não
// pertence a tenant nenhum, então esse objeto só existe pra satisfazer o
// contrato dos componentes reaproveitados; os campos de cor não são lidos
// (TenantMark usa a classe bg-primary, que cai no default de
// styles/theme.css nesse host, não em tenant.primaryColor).
const PLATFORM_BRAND: PublicTenant = {
  id: 'platform',
  slug: 'platform',
  name: 'Painel Admin',
  logoUrl: null,
  primaryColor: '#e6e51e',
  primaryInkColor: '#000000',
  accentColor: '#466cf3',
  timezone: 'America/Sao_Paulo',
  registerCount: 1,
}

const PLATFORM_NAV_ITEMS: NavItem[] = [
  { key: 'tenants', label: 'Lojas', href: '/platform/tenants', icon: ProductsIcon },
  { key: 'account', label: 'Minha Conta', href: '/platform/account', icon: SettingsIcon },
]

// Mesmo padrão de useAppShell (components/layout), adaptado pra uma conta
// que não é Operator/Tenant — reusa Sidebar/BottomNav como estão.
export function usePlatformShell() {
  const admin = usePlatformSession()
  const pathname = usePathname()
  const router = useRouter()
  const logout = usePlatformLogout()
  const sidebar = useSidebarCollapse()

  const items = PLATFORM_NAV_ITEMS.map((item) => ({ ...item, active: isNavItemActive(item, pathname) }))

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push('/platform/login')
        router.refresh()
      },
    })
  }

  return {
    tenant: PLATFORM_BRAND,
    operatorName: admin.name,
    operatorPhotoUrl: null,
    roleLabel: 'Superadmin',
    items,
    isLoggingOut: logout.isPending,
    handleLogout,
    sidebarCollapsed: sidebar.collapsed,
    toggleSidebarCollapsed: sidebar.toggle,
  }
}
