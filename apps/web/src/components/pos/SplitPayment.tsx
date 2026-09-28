import type { ChangeEvent } from 'react'
import type { PaymentMethod } from '@pdv/shared'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format-currency'
import { maskMoneyInput } from '@/lib/utils/money'
import { PaymentMethodPicker } from './PaymentMethodPicker'

interface SplitPaymentProps {
  firstMethod: PaymentMethod | null
  firstAmountText: string
  secondMethod: PaymentMethod | null
  remainderCents: number
  onFirstMethodChange: (method: PaymentMethod) => void
  onFirstAmountChange: (text: string) => void
  onSecondMethodChange: (method: PaymentMethod) => void
  firstAmountError?: string
  secondMethodError?: string
}

// Pagamento misto: 1º pagamento com valor digitado, 2º pagamento paga o
// resto. As duas formas podem ser iguais (2 cartões). Só mostra o resto ao
// vivo; quem valida (valor < total) é a API.
export function SplitPayment({
  firstMethod,
  firstAmountText,
  secondMethod,
  remainderCents,
  onFirstMethodChange,
  onFirstAmountChange,
  onSecondMethodChange,
  firstAmountError,
  secondMethodError,
}: SplitPaymentProps) {
  return (
    <div className="flex flex-col gap-4" data-cy="split-payment">
      <section className="flex flex-col gap-2">
        <h3 className="font-body text-sm font-bold">1º pagamento</h3>
        <PaymentMethodPicker label="1º pagamento" value={firstMethod} onChange={onFirstMethodChange} />
        <Input
          label="Valor"
          leading="R$"
          inputMode="decimal"
          placeholder="0,00"
          name="partialAmount"
          value={firstAmountText}
          error={firstAmountError}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onFirstAmountChange(maskMoneyInput(event.target.value))}
        />
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between" data-cy="split-remainder">
          <h3 className="font-body text-sm font-bold">2º pagamento · o resto</h3>
          <span className="font-heading text-xl font-bold tracking-tight">
            {Number.isFinite(remainderCents) ? formatCurrency(remainderCents) : '—'}
          </span>
        </div>
        <PaymentMethodPicker
          label="2º pagamento"
          value={secondMethod}
          onChange={onSecondMethodChange}
          error={secondMethodError}
        />
      </section>
    </div>
  )
}
