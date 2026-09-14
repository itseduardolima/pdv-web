import type { CashSessionSummary, PublicTenant } from '@pdv/shared'

// HU 4.7: com 1 caixa (v1, registerCount default) o rótulo continua o
// número ordinal da sessão, como sempre foi. Com mais de 1 caixa físico,
// o que identifica a sessão pro operador é o caixa em si, não a ordem.
export function cashSessionBadgeLabel(tenant: PublicTenant, session: CashSessionSummary): string {
  return tenant.registerCount > 1 ? `Caixa ${session.registerNumber}` : `Caixa #${session.sequence}`
}
