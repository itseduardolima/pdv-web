const dayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
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
