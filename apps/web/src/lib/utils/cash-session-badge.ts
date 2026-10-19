import type { CashSessionSummary } from '@pdv/shared'

export function cashSessionBadgeLabel(session: CashSessionSummary): string {
  return `Caixa ${session.registerNumber}`
}
