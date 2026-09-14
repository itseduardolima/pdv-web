'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { OperatorSalesRow } from '@/components/pos/OperatorSalesRow'
import { PaymentMethodIllustration } from '@/components/pos/PaymentMethodIllustration'
import { StagnantProductRow } from '@/components/pos/StagnantProductRow'
import { StatTile } from '@/components/pos/StatTile'
import { TopProductRow } from '@/components/pos/TopProductRow'
import { TotalCard } from '@/components/pos/TotalCard'
import { WeekChart } from '@/components/pos/WeekChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader } from '@/components/ui/Loader'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayLong, parseDayKey } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { useReportsPage } from './use-reports-page'

export default function ReportsPage() {
  const page = useReportsPage()
  const summary = page.summary

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle={
          summary
            ? `${formatDayLong(parseDayKey(summary.from))} — ${formatDayLong(parseDayKey(summary.to))}`
            : 'Carregando...'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {page.periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => page.handlePeriodChange(option.value)}
                aria-pressed={page.period === option.value}
                className={`rounded-pill border-[1.5px] border-ink px-4 py-2 font-body text-xs font-semibold md:text-[13px] ${
                  page.period === option.value ? 'bg-primary text-primary-ink' : 'bg-surface text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {page.period === 'custom' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
          <Input
            type="date"
            label="De"
            value={page.customFrom}
            onChange={(event) => page.setCustomFrom(event.target.value)}
          />
          <Input
            type="date"
            label="Até"
            value={page.customTo}
            onChange={(event) => page.setCustomTo(event.target.value)}
          />
        </div>
      )}

      {page.errorMessage && <InlineAlert>{page.errorMessage}</InlineAlert>}

      {page.isLoading && <Loader className="flex-1" />}

      {summary && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:gap-[18px]">
            <TotalCard label="Total no período" totalCents={summary.totalCents}>
              {summary.previousPeriod.deltaPercent !== null && (
                <span className="rounded-pill bg-primary px-3.5 py-1.5 font-body text-xs font-semibold text-primary-ink">
                  {summary.previousPeriod.deltaPercent >= 0 ? '+' : ''}
                  {summary.previousPeriod.deltaPercent}% vs período anterior
                </span>
              )}
              <span className="font-body text-xs text-surface/50">
                {summary.salesCount} {summary.salesCount === 1 ? 'venda realizada' : 'vendas realizadas'}
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

          <section className="flex flex-col gap-4 rounded-card bg-surface p-4 md:p-6">
            <div>
              <h2 className="font-heading text-lg font-bold tracking-tight">Vendas no Período</h2>
              <p className="font-body text-xs text-ink/45">Total vendido por dia</p>
            </div>
            <WeekChart days={summary.days} />
          </section>

          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:gap-[18px]">
            <section className="flex flex-col gap-2 rounded-card bg-surface p-4 md:p-6">
              <h2 className="font-heading text-lg font-bold tracking-tight">Mais Vendidos</h2>
              <p className="font-body text-xs text-ink/45">Por quantidade, para saber o que repor</p>
              {summary.topProducts.length > 0 ? (
                <ol className="divide-y divide-border">
                  {summary.topProducts.map((product, index) => (
                    <TopProductRow key={product.productId} position={index + 1} product={product} />
                  ))}
                </ol>
              ) : (
                <EmptyState size="sm" title="Nenhuma venda no período" description="Os mais vendidos aparecem aqui." />
              )}
            </section>

            <section className="flex flex-col gap-2 rounded-card bg-surface p-4 md:p-6">
              <h2 className="font-heading text-lg font-bold tracking-tight">Vendas por Operador</h2>
              <p className="font-body text-xs text-ink/45">Distribuição na equipe no período</p>
              {summary.byOperator.length > 0 ? (
                <ul className="divide-y divide-border">
                  {summary.byOperator.map((operator) => (
                    <OperatorSalesRow key={operator.operatorId} operator={operator} />
                  ))}
                </ul>
              ) : (
                <EmptyState size="sm" title="Nenhuma venda no período" description="A distribuição aparece aqui." />
              )}
            </section>

            <section className="flex flex-col gap-2 rounded-card bg-surface p-4 md:p-6">
              <h2 className="font-heading text-lg font-bold tracking-tight">Produtos Parados</h2>
              <p className="font-body text-xs text-ink/45">Pouca ou nenhuma venda — candidatos a promoção</p>
              {summary.stagnantProducts.length > 0 ? (
                <ul className="divide-y divide-border">
                  {summary.stagnantProducts.map((product) => (
                    <StagnantProductRow key={product.productId} product={product} />
                  ))}
                </ul>
              ) : (
                <EmptyState size="sm" title="Nenhum produto parado" description="Tudo girando bem no período." />
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}
