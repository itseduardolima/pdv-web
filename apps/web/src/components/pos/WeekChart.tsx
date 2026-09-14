import type { DashboardDay } from '@pdv/shared'
import { scaleBars } from '@/lib/utils/chart'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/format-currency'
import { formatDayMonthShort, formatDayNumber, formatWeekdayShort } from '@/lib/utils/format-date'

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
  // Até ~10 colunas dá pra rotular o dia da semana por extenso (como o
  // Dashboard sempre fez). Acima disso (Relatórios com Mês, 30 dias) o rótulo
  // vira só o número do dia (1, 2, 3...) — cabe mais apertado, mas ainda dá
  // pra ler qual dia é qual sem precisar passar o mouse em cada barra.
  const dense = columns > 10
  // Períodos calendário (Mês/Ano) podem incluir dias futuros do próprio
  // mês — "hoje" não é necessariamente a última coluna, precisa comparar
  // a data mesmo (mesmo raciocínio do destaque de hora atual no HourChart).
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Vendas nos últimos ${columns} dias`}
        className="h-[140px] w-full md:h-[180px]"
      >
        {days.map((day, index) => {
          const slot = width / columns
          // Com poucas colunas (ex.: período "Hoje", 1 dia só) a barra não
          // pode crescer pra preencher o slot inteiro — vira um bloco
          // sólido sem parecer gráfico nenhum. Largura máxima fixa, mesmo
          // limite (7 colunas do Dashboard) já ficava perto disso.
          const barWidth = Math.min(slot * 0.55, 8)
          const x = index * slot + (slot - barWidth) / 2
          const height = Math.max(MIN_BAR, (heights[index] ?? 0) * (CHART_HEIGHT - MIN_BAR))
          const isToday = day.date === todayKey
          return (
            <rect
              key={day.date}
              x={x}
              y={CHART_HEIGHT - height}
              width={barWidth}
              height={height}
              rx={1.5}
              className={day.totalCents === 0 ? 'fill-border' : isToday ? 'fill-primary' : 'fill-primary/45'}
            >
              <title>{`${formatDayMonthShort(day.date)}: ${formatCurrency(day.totalCents)}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption
        className={`grid font-body text-ink/50 ${dense ? 'text-[9px] md:text-[10px]' : 'text-[11px] md:text-xs'}`}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {days.map((day) => (
          <span
            key={day.date}
            data-cy="week-day"
            className={`flex flex-col items-center gap-0.5 overflow-hidden ${day.date === todayKey ? 'font-bold text-ink' : ''}`}
          >
            <span>{dense ? formatDayNumber(day.date) : formatWeekdayShort(day.date)}</span>
            <span
              className={
                dense
                  ? 'h-3 whitespace-nowrap text-[8px] leading-3 font-semibold text-ink md:text-[9px]'
                  : 'hidden font-semibold text-ink md:inline'
              }
            >
              {day.totalCents > 0
                ? dense
                  ? formatCurrencyCompact(day.totalCents)
                  : formatCurrency(day.totalCents)
                : ''}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
