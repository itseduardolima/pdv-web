import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function SellIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M3 4h2.2l1.9 11.4a2 2 0 002 1.6h8.6a2 2 0 002-1.9L21 8.5H6.3" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  )
}

export function ProductsIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M3.5 8L12 4l8.5 4-8.5 4-8.5-4z" />
      <path d="M3.5 8v9l8.5 4 8.5-4V8" />
      <path d="M12 12v9" />
    </svg>
  )
}

export function ClosingIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <line x1="5" y1="19" x2="5" y2="12" />
      <line x1="12" y1="19" x2="12" y2="6" />
      <line x1="19" y1="19" x2="19" y2="10" />
    </svg>
  )
}

export function OperatorsIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.3" width="16" height="16" {...props}>
      <circle cx="10" cy="10" r="6.5" />
      <line x1="19" y1="19" x2="14.8" y2="14.8" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="14" height="14" {...props}>
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.6" width="14" height="14" {...props}>
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  )
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="18" height="18" {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.6" width="18" height="18" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="18" height="18" {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="18" height="18" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
