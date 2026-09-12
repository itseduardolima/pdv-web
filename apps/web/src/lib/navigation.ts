import type { ComponentType, SVGProps } from 'react'
import type { OperatorRole } from '@pdv/shared'
import { ClosingIcon, DashboardIcon, OperatorsIcon, ProductsIcon, SellIcon } from '@/components/ui/Icons'

export interface NavItem {
  key: string
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  roles?: OperatorRole[]
}

// Lista única de navegação (05-componentizacao): Sidebar e BottomNav leem daqui.
export const NAV_ITEMS: NavItem[] = [
  { key: 'sell', label: 'Vender', href: '/sell', icon: SellIcon },
  { key: 'products', label: 'Produtos', href: '/products', icon: ProductsIcon },
  { key: 'closing', label: 'Fechamento', href: '/closing', icon: ClosingIcon },
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: DashboardIcon, roles: ['ADMIN'] },
  { key: 'operators', label: 'Operadores', href: '/operators', icon: OperatorsIcon, roles: ['ADMIN'] },
]

export function navItemsForRole(role: OperatorRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export const ROLE_LABEL: Record<OperatorRole, string> = { ADMIN: 'Administrador', OPERATOR: 'Operador' }
