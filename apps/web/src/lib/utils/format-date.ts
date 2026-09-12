const dayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const dayMonthFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })

// "2026-09-12" (dia no fuso da loja, vindo da API) -> Date local ao meio-dia,
// só para formatar o rótulo sem risco de virar o dia anterior.
export function parseDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day, 12)
}

// "Sáb"
export function formatWeekdayShort(dayKey: string): string {
  return capitalize(weekdayFormatter.format(parseDayKey(dayKey)).replace('.', ''))
}

// "12 de set"
export function formatDayMonthShort(dayKey: string): string {
  return dayMonthFormatter.format(parseDayKey(dayKey)).replace('.', '')
}

// "Sex, 11 de setembro"
export function formatDayLong(date: Date): string {
  return capitalize(dayFormatter.format(date).replace('.', ''))
}

// "08:00"
export function formatTime(date: Date): string {
  return timeFormatter.format(date)
}

// "Sex, 11 de setembro · 08:00"
export function formatDayAndTime(date: Date): string {
  return `${formatDayLong(date)} · ${formatTime(date)}`
}
