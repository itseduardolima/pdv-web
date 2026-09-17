import type { ComponentType, SVGProps } from 'react'
import { OPERATOR_ROLE_LABEL, type OperatorRole } from '@pdv/shared'
import {
  ClosingIcon,
  DashboardIcon,
  OperatorsIcon,
  ProductsIcon,
  ReportsIcon,
  SellIcon,
  SettingsIcon,
} from '@/components/ui/Icons'

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
  { key: 'reports', label: 'Relatórios', href: '/reports', icon: ReportsIcon, roles: ['ADMIN'] },
  { key: 'operators', label: 'Operadores', href: '/operators', icon: OperatorsIcon, roles: ['ADMIN'] },
  { key: 'settings', label: 'Configurações', href: '/settings', icon: SettingsIcon, roles: ['ADMIN'] },
]

export function navItemsForRole(role: OperatorRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

// Itens que ficam de fora da bottom-nav quando ela precisa colapsar (ADMIN,
// 7 itens): Produtos, Relatórios, Operadores e Configurações são consultados
// com menos frequência no dia a dia do caixa do que Vender/Fechamento/Dashboard.
const BOTTOM_NAV_OVERFLOW_KEYS = new Set(['products', 'reports', 'operators', 'settings'])

// Bottom-nav do celular não cabe mais que ~4 ícones sem apertar o alvo de
// toque (ADMIN vê até 7 itens). Só junta o excedente num item "Mais" quando
// isso realmente reduz a quantidade de botões — com poucos itens (operador
// comum, 3) mostra todos direto, sem "Mais".
export function splitBottomNavItems<T extends NavItem>(items: T[], maxPrimary = 4): { primary: T[]; overflow: T[] } {
  if (items.length <= maxPrimary + 1) return { primary: items, overflow: [] }
  return {
    primary: items.filter((item) => !BOTTOM_NAV_OVERFLOW_KEYS.has(item.key)),
    overflow: items.filter((item) => BOTTOM_NAV_OVERFLOW_KEYS.has(item.key)),
  }
}

export const ROLE_LABEL = OPERATOR_ROLE_LABEL
