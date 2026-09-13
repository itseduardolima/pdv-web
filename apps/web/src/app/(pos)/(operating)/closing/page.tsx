'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentMethodIllustration } from '@/components/pos/PaymentMethodIllustration'
import { SaleHistoryRow } from '@/components/pos/SaleHistoryRow'
import { StatTile } from '@/components/pos/StatTile'
import { TotalCard } from '@/components/pos/TotalCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayLong, formatTime } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { useClosingPage } from './use-closing-page'

export default function ClosingPage() {
  const page = useClosingPage()
  const session = page.session
  const openedAt = session ? new Date(session.openedAt) : null

  return (
    <>
      <PageHeader
        title="Fechamento de Caixa"
        subtitle={
          openedAt ? `${formatDayLong(openedAt)} · Caixa aberto desde ${formatTime(openedAt)}` : 'Carregando...'
        }
        actions={
          session && (
            <span className="rounded-pill bg-ink px-4 py-1.5 font-body text-[13px] font-medium text-surface">
              Caixa #{session.sequence}
            </span>
          )
        }
      />

      {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

      {session && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:gap-[18px]">
            <TotalCard label="Total do caixa" totalCents={session.totalCents}>
              <span className="rounded-pill bg-primary px-3.5 py-1.5 font-body text-xs font-semibold text-primary-ink">
                Fundo inicial {formatCurrency(session.openingAmountCents)}
              </span>
              <span className="font-body text-xs text-surface/50">
                {session.salesCount} {session.salesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
              </span>
            </TotalCard>

            <div className="grid min-w-0 grid-cols-3 gap-2 md:flex-[1.5] md:gap-3.5">
              {page.tiles.map(({ method, cents, percent }) => {
                return (
                  <StatTile
                    key={method}
                    icon={<PaymentMethodIllustration method={method} className="h-5 w-5 md:h-7 md:w-7" />}
                    amount={formatCurrency(cents)}
                    label={PAYMENT_METHOD_LABEL[method]}
                    detail={`${percent}% do total`}
                  />
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={page.handleClose}
              state={page.closeState}
              size="sm"
              successLabel="Caixa fechado"
              className="w-full sm:w-auto"
            >
              Confirmar Fechamento
            </Button>
          </div>

          <section
            // Abaixo de md a página cresce livremente com a tela (sem
            // altura travada), então min-h sozinho não trava a lista — o
            // histórico de uma sessão longa cresceria sem fim; precisa de
            // um teto com rolagem própria (2026-09-13, mesmo ajuste do
            // grid de produtos em Vender).
            className="flex max-h-[54vh] min-h-[320px] flex-1 flex-col gap-3 rounded-card bg-surface p-4 md:max-h-none md:min-h-0 md:p-[22px]"
          >
            <h2 className="font-heading text-lg font-bold tracking-tight">Histórico de Vendas</h2>
            {page.isLoadingSales ? (
              <p className="font-body text-sm text-ink/50">Carregando...</p>
            ) : page.sales.length === 0 ? (
              <EmptyState title="Nenhuma venda ainda" description="As vendas deste caixa aparecem aqui." />
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {page.sales.map((sale) => (
                  <SaleHistoryRow key={sale.id} sale={sale} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
