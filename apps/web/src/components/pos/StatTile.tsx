import type { ReactNode } from 'react'

interface StatTileProps {
  icon: ReactNode
  amount: string
  label: string
  detail?: string
}

export function StatTile({ icon, amount, label, detail }: StatTileProps) {
  return (
    // min-w-0: item de grid/flex não encolhe abaixo do texto sozinho por
    // padrão — sem isso um valor grande ("R$ 2.205,71") estoura a coluna e
    // corta na borda da tela em vez de truncar (2026-09-13).
    <div className="flex min-w-0 flex-col justify-between gap-2.5 rounded-card-sm bg-surface p-3 md:rounded-card md:p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-frame bg-canvas text-ink md:h-11 md:w-11">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate font-heading text-[15px] font-bold tracking-tight md:text-2xl">{amount}</p>
        <p className="truncate font-body text-[10px] font-medium text-ink/50 md:text-[13px]">{label}</p>
      </div>
      {detail && <p className="truncate font-body text-[10px] font-semibold text-accent md:text-xs">{detail}</p>}
    </div>
  )
}
