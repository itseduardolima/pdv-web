import type { ReportMonth } from '@pdv/shared'
import { scaleBars } from '@/lib/utils/chart'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/format-currency'
import { formatMonthShort } from '@/lib/utils/format-date'

interface MonthChartProps {
  months: ReportMonth[]
}

const CHART_HEIGHT = 140
const MIN_BAR = 3

// HU 12.4: "Ano" quebrado pelos 12 meses do ano corrente — só 12 colunas
// (bem menos que os 30/365 dias de Mês/Semana-densa), então mês e valor de
// cada barra ficam sempre visíveis, sem depender do hover.
export function MonthChart({ months }: MonthChartProps) {
  const heights = scaleBars(months.map((m) => m.totalCents))
  const columns = months.length
  const width = 100
  const currentMonth = new Date().getMonth() + 1

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Vendas do ano por mês"
        className="h-[140px] w-full md:h-[180px]"
      >
        {months.map((m, index) => {
          const slot = width / columns
          const barWidth = Math.min(slot * 0.55, 8)
          const x = index * slot + (slot - barWidth) / 2
          const height = Math.max(MIN_BAR, (heights[index] ?? 0) * (CHART_HEIGHT - MIN_BAR))
          const current = m.month === currentMonth
          return (
            <rect
              key={m.month}
              x={x}
              y={CHART_HEIGHT - height}
              width={barWidth}
              height={height}
              rx={1.5}
              className={m.totalCents === 0 ? 'fill-border' : current ? 'fill-primary' : 'fill-primary/45'}
            >
              <title>{`${formatMonthShort(m.month)}: ${formatCurrency(m.totalCents)}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption
        className="grid font-body text-[11px] text-ink/50 md:text-xs"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {months.map((m) => (
          <span
            key={m.month}
            className={`flex flex-col items-center gap-0.5 ${m.month === currentMonth ? 'font-bold text-ink' : ''}`}
          >
            <span>{formatMonthShort(m.month)}</span>
            <span className="whitespace-nowrap font-semibold text-ink">
              {m.totalCents > 0 ? formatCurrencyCompact(m.totalCents) : '—'}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
