import type { ReportHour } from '@pdv/shared'
import { scaleBars } from '@/lib/utils/chart'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/format-currency'

interface HourChartProps {
  hours: ReportHour[]
}

const CHART_HEIGHT = 140
const MIN_BAR = 3

// HU 12.4: "Hoje" quebrado por horário (24 barras) em vez de um único bloco
// — mesmo motor visual do WeekChart (barra relativa ao pico do período,
// tooltip com o valor exato), só que por hora em vez de por dia. Diferente
// do WeekChart em períodos densos, aqui o horário e o valor de cada barra
// ficam sempre visíveis (não só no hover) — pedido explícito do usuário,
// já que "Hoje" é o período mais consultado durante o expediente.
export function HourChart({ hours }: HourChartProps) {
  const heights = scaleBars(hours.map((h) => h.totalCents))
  const columns = hours.length
  const width = 100
  const currentHour = new Date().getHours()

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Vendas de hoje por horário"
        className="h-[140px] w-full md:h-[180px]"
      >
        {hours.map((h, index) => {
          const slot = width / columns
          const barWidth = Math.min(slot * 0.55, 8)
          const x = index * slot + (slot - barWidth) / 2
          const height = Math.max(MIN_BAR, (heights[index] ?? 0) * (CHART_HEIGHT - MIN_BAR))
          const current = h.hour === currentHour
          return (
            <rect
              key={h.hour}
              x={x}
              y={CHART_HEIGHT - height}
              width={barWidth}
              height={height}
              rx={1.5}
              className={h.totalCents === 0 ? 'fill-border' : current ? 'fill-primary' : 'fill-primary/45'}
            >
              <title>{`${String(h.hour).padStart(2, '0')}h: ${formatCurrency(h.totalCents)}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption
        className="grid font-body text-[9px] text-ink/50 md:text-[10px]"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {hours.map((h) => (
          <span
            key={h.hour}
            className={`flex flex-col items-center gap-0.5 overflow-hidden ${h.hour === currentHour ? 'font-bold text-ink' : ''}`}
          >
            <span className="h-3 whitespace-nowrap text-[8px] leading-3 md:text-[9px]">
              {h.totalCents > 0 ? formatCurrencyCompact(h.totalCents) : ''}
            </span>
            <span>{String(h.hour).padStart(2, '0')}h</span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
