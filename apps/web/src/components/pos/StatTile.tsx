import type { ReactNode } from 'react'

interface StatTileProps {
  icon: ReactNode
  amount: string
  label: string
  detail?: string
}

export function StatTile({ icon, amount, label, detail }: StatTileProps) {
  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-card-sm bg-surface p-3 md:rounded-card md:p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-frame bg-canvas text-ink md:h-11 md:w-11">{icon}</div>
      <div>
        <p className="font-heading text-[15px] font-bold tracking-tight md:text-2xl">{amount}</p>
        <p className="font-body text-[10px] font-medium text-ink/50 md:text-[13px]">{label}</p>
      </div>
      {detail && <p className="font-body text-[10px] font-semibold text-accent md:text-xs">{detail}</p>}
    </div>
  )
}
