'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { SaleDetailsDialog } from '@/components/pos/SaleDetailsDialog'
import { SaleHistoryEntry } from '@/components/pos/SaleHistoryEntry'
import { DateRangePopover } from '@/components/ui/DateRangePopover'
import { EmptyState } from '@/components/ui/EmptyState'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader } from '@/components/ui/Loader'
import { SearchBar } from '@/components/ui/SearchBar'
import { useHistoryPage } from './use-history-page'

export default function HistoryPage() {
  const page = useHistoryPage()

  return (
    <>
      <PageHeader
        title="Histórico de Vendas"
        actions={
          <div className="flex flex-wrap gap-2">
            {page.directPeriodOptions.map((option) => (
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
            <DateRangePopover
              mode="single"
              label="Escolher dia"
              active={page.period === 'day'}
              value={page.dayValue}
              onApply={(day) => page.handleApplyDay(day)}
            />
          </div>
        }
      />

      <SearchBar
        placeholder="Buscar por produto…"
        value={page.search}
        onChange={(event) => page.handleSearchChange(event.target.value)}
      />

      {page.errorMessage && <InlineAlert>{page.errorMessage}</InlineAlert>}

      {page.isLoading ? (
        <Loader className="flex-1" />
      ) : page.sales.length === 0 ? (
        <EmptyState
          title="Nenhuma venda encontrada"
          description="Troque o dia ou o termo buscado pra ver outras vendas."
        />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {page.sales.map((sale) => (
            <SaleHistoryEntry key={sale.id} sale={sale} onSelect={page.handleSelectSale} />
          ))}
        </ul>
      )}

      <SaleDetailsDialog sale={page.selectedSale} onOpenChange={(open) => !open && page.handleCloseSaleDetails()} />
    </>
  )
}
