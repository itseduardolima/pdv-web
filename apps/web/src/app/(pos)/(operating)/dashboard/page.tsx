'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentMethodIllustration } from '@/components/pos/PaymentMethodIllustration'
import { StatTile } from '@/components/pos/StatTile'
import { TopProductRow } from '@/components/pos/TopProductRow'
import { TotalCard } from '@/components/pos/TotalCard'
import { WeekChart } from '@/components/pos/WeekChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayLong, parseDayKey } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { useDashboardPage } from './use-dashboard-page'

export default function DashboardPage() {
  const page = useDashboardPage()
  const summary = page.summary

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={summary ? `Hoje · ${formatDayLong(parseDayKey(summary.today.date))}` : 'Carregando...'}
      />

      {page.errorMessage && <InlineAlert>{page.errorMessage}</InlineAlert>}

      {summary && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:gap-[18px]">
            <TotalCard label="Vendido hoje" totalCents={summary.today.totalCents} dataCy="today-total">
              <span className="font-body text-xs text-surface/50">
                {summary.today.salesCount} {summary.today.salesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
              </span>
            </TotalCard>

            <div className="grid min-w-0 grid-cols-3 gap-2 md:flex-[1.5] md:gap-3.5">
              {page.tiles.map(({ method, cents, percent }) => (
                <StatTile
                  key={method}
                  icon={<PaymentMethodIllustration method={method} className="h-5 w-5 md:h-7 md:w-7" />}
                  amount={formatCurrency(cents)}
                  label={PAYMENT_METHOD_LABEL[method]}
                  detail={`${percent}% do total`}
                />
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-5 md:gap-[18px]">
            <section className="flex flex-col gap-4 rounded-card bg-surface p-4 md:col-span-3 md:p-6">
              <div>
                <h2 className="font-heading text-lg font-bold tracking-tight">Últimos 7 dias</h2>
                <p className="font-body text-xs text-ink/45">Total vendido por dia</p>
              </div>
              <WeekChart days={summary.week} />
            </section>

            <section className="flex flex-col gap-2 rounded-card bg-surface p-4 md:col-span-2 md:p-6">
              <div>
                <h2 className="font-heading text-lg font-bold tracking-tight">Mais vendidos hoje</h2>
                <p className="font-body text-xs text-ink/45">Por quantidade, para saber o que repor</p>
              </div>
              {summary.topProductsToday.length > 0 ? (
                <ol className="divide-y divide-border">
                  {summary.topProductsToday.map((product, index) => (
                    <TopProductRow key={product.productId} position={index + 1} product={product} />
                  ))}
                </ol>
              ) : (
                <EmptyState size="sm" title="Nenhuma venda hoje" description="Os mais vendidos aparecem aqui." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}
