import type { Sale } from '@pdv/shared'
import { SaleIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatTime } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'

export function SaleHistoryRow({ sale }: { sale: Sale }) {
  const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0)
  const itemsLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`
  return (
    <li className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-frame bg-canvas text-ink/70">
        <SaleIcon aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium">
          {itemsLabel} · {sale.operatorName} · {PAYMENT_METHOD_LABEL[sale.paymentMethod]}
        </p>
        <p className="font-body text-xs text-ink/40">{formatTime(new Date(sale.soldAt))}</p>
      </div>
      <span className="font-body text-sm font-semibold">{formatCurrency(sale.totalCents)}</span>
    </li>
  )
}
