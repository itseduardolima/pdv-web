import type { DashboardDay } from '@pdv/shared'
import { scaleBars } from '@/lib/utils/chart'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayMonthShort, formatWeekdayShort } from '@/lib/utils/format-date'

interface WeekChartProps {
  days: DashboardDay[]
}

const CHART_HEIGHT = 140
const MIN_BAR = 3

// Gráfico da semana (HU 7.3): SVG puro, sem lib. Barras na cor primária da
// loja, o dia de hoje (último) mais forte, dias sem venda como traço fino.
export function WeekChart({ days }: WeekChartProps) {
  const heights = scaleBars(days.map((day) => day.totalCents))
  const columns = days.length
  const width = 100

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Vendas dos últimos 7 dias"
        className="h-[140px] w-full md:h-[180px]"
      >
        {days.map((day, index) => {
          const slot = width / columns
          const barWidth = slot * 0.55
          const x = index * slot + (slot - barWidth) / 2
          const height = Math.max(MIN_BAR, (heights[index] ?? 0) * (CHART_HEIGHT - MIN_BAR))
          const today = index === columns - 1
          return (
            <rect
              key={day.date}
              x={x}
              y={CHART_HEIGHT - height}
              width={barWidth}
              height={height}
              rx={1.5}
              className={day.totalCents === 0 ? 'fill-border' : today ? 'fill-primary' : 'fill-primary/45'}
            >
              <title>{`${formatDayMonthShort(day.date)}: ${formatCurrency(day.totalCents)}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption
        className="grid font-body text-[11px] text-ink/50 md:text-xs"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {days.map((day, index) => (
          <span
            key={day.date}
            data-cy="week-day"
            className={`flex flex-col items-center gap-0.5 ${index === columns - 1 ? 'font-bold text-ink' : ''}`}
          >
            <span>{formatWeekdayShort(day.date)}</span>
            <span className="hidden font-semibold text-ink md:inline">{formatCurrency(day.totalCents)}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
