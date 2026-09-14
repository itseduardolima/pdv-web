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
  // Até ~10 colunas dá pra rotular todo dia (dia da semana + valor, como o
  // Dashboard sempre fez). Acima disso (Relatórios com Mês/Ano, 30-365
  // dias) a escala é sempre relativa ao maior dia do período, não um eixo
  // em reais — uma legenda por dia (mesmo esparsa) não ajuda a ler o
  // gráfico nesse caso, só polui; o valor exato de cada barra continua no
  // tooltip ao passar o mouse (decisão de 2026-09-14, depois de explicar
  // como o gráfico escala).
  const showCaption = columns <= 10

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
      {showCaption && (
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
      )}
    </figure>
  )
}
