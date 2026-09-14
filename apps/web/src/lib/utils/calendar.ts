// Grade de um mês pro DateRangePopover — sem lib de datas, só o que o
// calendário precisa: dia da semana em que o mês começa (pra alinhar a
// grade) e a lista de dayKeys ("YYYY-MM-DD") do mês.

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function dayKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export interface MonthGrid {
  year: number
  month: number // 0-11
  // Quantas células em branco antes do dia 1 (0 = domingo primeiro da semana).
  leadingBlanks: number
  days: string[] // dayKeys, dia 1 até o último do mês
}

export function monthGrid(year: number, month: number): MonthGrid {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => dayKeyFromDate(new Date(year, month, i + 1)))
  return { year, month, leadingBlanks: firstDay.getDay(), days }
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

export function monthLabel(year: number, month: number): string {
  const label = MONTH_LABEL_FORMATTER.format(new Date(year, month, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}
