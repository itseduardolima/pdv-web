import type { ReportOperator } from '@pdv/shared'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency } from '@/lib/utils/format-currency'

interface OperatorSalesRowProps {
  operator: ReportOperator
}

// Linha de "Vendas por Operador" (HU 12.6) — visão de negócio (quem vendeu
// quanto), não é ferramenta de vigilância.
export function OperatorSalesRow({ operator }: OperatorSalesRowProps) {
  return (
    <li data-cy="operator-sales-row" className="flex items-center gap-3 py-2.5">
      <Avatar name={operator.name} photoUrl={null} className="!h-9 !w-9 !text-xs" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-ink">{operator.name}</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-canvas">
          <div className="h-full rounded-pill bg-accent" style={{ width: `${operator.percent}%` }} />
        </div>
      </div>
      <span className="shrink-0 font-heading text-sm font-bold">{formatCurrency(operator.totalCents)}</span>
    </li>
  )
}
