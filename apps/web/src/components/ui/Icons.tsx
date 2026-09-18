import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

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

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M3 12a9 9 0 109-9" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
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

export function ReportsIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
      <path d="M15 2v5h5" />
      <path d="M9 17v-4" />
      <path d="M12.5 17v-7" />
      <path d="M16 17v-2.5" />
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

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="32" height="32" {...props}>
      <path d="M3 7a2 2 0 012-2h13a1 1 0 011 1v2" />
      <path d="M3 7v11a2 2 0 002 2h15a1 1 0 001-1V9a1 1 0 00-1-1H5a2 2 0 01-2-2z" />
      <circle cx="16.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CashIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="24" height="24" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="24" height="24" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  )
}

export function PixIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="24" height="24" {...props}>
      <path d="M12 3l4 4-4 4-4-4z" />
      <path d="M12 13l4 4-4 4-4-4z" />
      <path d="M3 12l4-4 4 4-4 4z" />
      <path d="M13 12l4-4 4 4-4 4z" />
    </svg>
  )
}

export function SaleIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="16" height="16" {...props}>
      <path d="M6 2h12l1 5H5z" />
      <path d="M5 7v13a1 1 0 001 1h12a1 1 0 001-1V7" />
      <path d="M9 11v2a3 3 0 006 0v-2" />
    </svg>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="28" height="28" {...props}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="16" height="16" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="16" height="16" {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export function BarcodeIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="18" height="18" {...props}>
      <path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" />
    </svg>
  )
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.4" width="36" height="36" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="16" height="16" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function BackspaceIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2" width="18" height="18" {...props}>
      <path d="M20 6H9l-6 6 6 6h11a2 2 0 002-2V8a2 2 0 00-2-2z" />
      <line x1="14" y1="10" x2="18" y2="14" />
      <line x1="18" y1="10" x2="14" y2="14" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" width="20" height="20" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.6 10.6 0 0112 5c6.5 0 10 7 10 7a15.6 15.6 0 01-3.6 4.4M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.9 9.9 0 004.4-1" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  )
}
