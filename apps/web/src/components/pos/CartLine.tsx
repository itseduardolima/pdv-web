import type { CartItem } from '@/lib/utils/cart'
import { formatCurrency } from '@/lib/utils/format-currency'

interface CartLineProps {
  item: CartItem
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  highlighted?: boolean
}

const stepButton =
  'flex h-6 w-6 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface font-body text-sm leading-none text-ink'

export function CartLine({ item, onIncrement, onDecrement, highlighted = false }: CartLineProps) {
  return (
    <li
      data-cy="cart-line"
      data-highlighted={highlighted || undefined}
      className={`flex items-center justify-between gap-2.5 border-b border-border py-2.5 last:border-b-0 ${highlighted ? '-mx-2 rounded-input bg-danger/[0.08] px-2' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[13px] font-medium md:text-sm">{item.name}</p>
        <p className="font-body text-[10px] text-ink/40 md:text-[11px]">
          {formatCurrency(item.unitPriceCents)} / {item.unit.toLowerCase()}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onDecrement(item.productId)}
          aria-label={`Diminuir ${item.name}`}
          className={stepButton}
        >
          −
        </button>
        <output className="w-4 text-center font-body text-[13px] font-semibold">{item.quantity}</output>
        <button
          type="button"
          onClick={() => onIncrement(item.productId)}
          aria-label={`Aumentar ${item.name}`}
          className={stepButton}
        >
          +
        </button>
      </div>
      <span className="w-[62px] shrink-0 text-right font-body text-[13px] font-semibold md:text-sm">
        {formatCurrency(item.quantity * item.unitPriceCents)}
      </span>
    </li>
  )
}
