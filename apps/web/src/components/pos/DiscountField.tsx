import type { ChangeEvent } from 'react'
import type { DiscountType } from '@pdv/shared'
import { Input } from '@/components/ui/Input'
import { maskMoneyInput, maskPercentInput } from '@/lib/utils/money'

const TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
  { value: 'AMOUNT', label: 'R$' },
  { value: 'PERCENT', label: '%' },
]

interface DiscountFieldProps {
  type: DiscountType
  value: string
  onTypeChange: (type: DiscountType) => void
  onValueChange: (text: string) => void
  error?: string
  onRemove?: () => void
}

export function DiscountField({ type, value, onTypeChange, onValueChange, error, onRemove }: DiscountFieldProps) {
  const mask = type === 'AMOUNT' ? maskMoneyInput : maskPercentInput
  return (
    <div data-cy="discount-field">
      <Input
        label="Desconto"
        name="discount"
        inputMode="decimal"
        placeholder={type === 'AMOUNT' ? '0,00' : '0'}
        leading={type === 'AMOUNT' ? 'R$' : undefined}
        trailing={type === 'PERCENT' ? '%' : undefined}
        value={value}
        error={error}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(mask(event.target.value))}
        labelAction={
          <div role="group" aria-label="Tipo de desconto" className="flex gap-1">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={type === option.value}
                onClick={() => onTypeChange(option.value)}
                className={`rounded-pill border-[1.5px] border-ink px-3 py-0.5 font-body text-xs font-semibold ${
                  type === option.value ? 'bg-ink text-surface' : 'bg-surface text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />
      {onRemove && (
        <button
          type="button"
          data-cy="discount-remove"
          onClick={onRemove}
          className="mt-1.5 font-body text-xs font-semibold text-ink/60 underline"
        >
          Remover desconto
        </button>
      )}
    </div>
  )
}
