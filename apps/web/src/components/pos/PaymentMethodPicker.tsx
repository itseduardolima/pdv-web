import type { PaymentMethod } from '@pdv/shared'
import { CardIcon, CashIcon, PixIcon } from '@/components/ui/Icons'
import { FieldError } from '@/components/ui/FieldError'
import { PAYMENT_METHOD_LABEL, PAYMENT_METHODS } from '@/lib/utils/payment-method'

const ICONS = { CASH: CashIcon, CARD: CardIcon, PIX: PixIcon }

interface PaymentMethodPickerProps {
  value: PaymentMethod | null
  onChange: (method: PaymentMethod) => void
  error?: string
}

export function PaymentMethodPicker({ value, onChange, error }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label="Forma de pagamento" className="flex gap-1.5 md:gap-2">
        {PAYMENT_METHODS.map((method) => {
          const Icon = ICONS[method]
          const selected = value === method
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(method)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-pill border-[1.5px] py-2 font-body text-[11px] font-semibold md:text-xs ${selected ? 'border-primary bg-primary text-primary-ink' : error ? 'border-danger text-ink' : 'border-ink bg-surface text-ink'}`}
            >
              <Icon aria-hidden width="14" height="14" />
              {PAYMENT_METHOD_LABEL[method]}
            </button>
          )
        })}
      </div>
      <FieldError id="payment-method-error" message={error} />
    </div>
  )
}
