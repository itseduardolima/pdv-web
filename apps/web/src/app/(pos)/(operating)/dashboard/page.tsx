'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { PaymentMethodIllustration } from '@/components/pos/PaymentMethodIllustration'
import { StatTile } from '@/components/pos/StatTile'
import { TopProductRow } from '@/components/pos/TopProductRow'
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
            <div className="relative flex flex-1 flex-col justify-between gap-3 overflow-hidden rounded-card bg-[color-mix(in_srgb,var(--color-ink)_82%,var(--color-primary))] p-5 text-surface md:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-pill bg-primary/20 blur-2xl"
              />
              <div className="relative">
                <p className="font-body text-[13px] font-medium text-surface/55">Vendido hoje</p>
                <p
                  data-cy="today-total"
                  className="mt-1 font-heading text-[34px] font-bold tracking-tight md:text-[46px]"
                >
                  {formatCurrency(summary.today.totalCents)}
                </p>
              </div>
              <p className="relative font-body text-xs text-surface/50">
                {summary.today.salesCount} {summary.today.salesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 md:flex-[1.5] md:gap-3.5">
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
