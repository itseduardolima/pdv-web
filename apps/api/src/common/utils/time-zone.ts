// Datas por fuso IANA sem biblioteca: só o que o Dashboard precisa —
// "que dia é hoje na loja" e "quando esse dia começa, em UTC".

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string): Intl.DateTimeFormat {
  let cached = partsFormatters.get(timeZone)
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsFormatters.set(timeZone, cached)
  }
  return cached
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts: Partial<ZonedParts> = {}
  for (const { type, value } of formatter(timeZone).formatToParts(date)) {
    if (
      type === 'year' ||
      type === 'month' ||
      type === 'day' ||
      type === 'hour' ||
      type === 'minute' ||
      type === 'second'
    ) {
      parts[type] = Number(value)
    }
  }
  return parts as ZonedParts
}

// Diferença (ms) entre o relógio local do fuso e o UTC naquele instante.
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()
}

// "2026-09-12" para o instante `date` visto do fuso.
export function dayKeyInTimeZone(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

// Hora local (0-23) do instante `date` no fuso — só o que o filtro "Hoje"
// dos Relatórios precisa pra quebrar o dia por horário em vez de um único bloco.
export function hourInTimeZone(date: Date, timeZone: string): number {
  return zonedParts(date, timeZone).hour
}

// Instante UTC em que o dia `dayKey` começa no fuso (respeita horário de verão).
export function startOfDayInTimeZone(dayKey: string, timeZone: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number]
  const localMidnight = Date.UTC(year, month - 1, day)
  let utc = localMidnight - offsetMs(new Date(localMidnight), timeZone)
  // Se o offset mudou entre o chute e o resultado (virada de horário de verão), corrige.
  const correction = localMidnight - offsetMs(new Date(utc), timeZone)
  if (correction !== utc) utc = correction
  return new Date(utc)
}

// dayKey deslocado em N dias (aritmética de calendário, sem fuso).
export function addDaysToDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number]
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return shifted.toISOString().slice(0, 10)
}

// Fuso inválido no banco não pode derrubar o Dashboard: cai para UTC.
export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone)
    return true
  } catch {
    return false
  }
}
