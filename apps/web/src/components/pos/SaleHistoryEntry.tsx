import type { Sale } from '@pdv/shared'
import { BackIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatTime } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { PaymentMethodIllustration } from './PaymentMethodIllustration'

// Card clicável de uma venda (Histórico de Vendas e Fechamento): clicar
// abre o SaleDetailsDialog com os itens.
export function SaleHistoryEntry({ sale, onSelect }: { sale: Sale; onSelect: (sale: Sale) => void }) {
  const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0)
  const itemsLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(sale)}
        className="flex w-full items-center gap-3 rounded-card-sm bg-surface p-3.5 text-left transition-colors hover:bg-canvas"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-canvas">
          <PaymentMethodIllustration method={sale.paymentMethod} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-semibold">{formatTime(new Date(sale.soldAt))}</p>
          <p className="truncate font-body text-xs text-ink/45">
            {itemsLabel} · {sale.operatorName} · {PAYMENT_METHOD_LABEL[sale.paymentMethod]}
          </p>
        </div>
        <span className="shrink-0 font-body text-sm font-bold">{formatCurrency(sale.totalCents)}</span>
        <BackIcon aria-hidden width="16" height="16" className="shrink-0 rotate-180 text-ink/30" />
      </button>
    </li>
  )
}
