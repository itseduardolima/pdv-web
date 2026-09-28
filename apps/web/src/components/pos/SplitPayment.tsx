import type { ChangeEvent } from 'react'
import { MAX_SALE_PAYMENTS, type PaymentMethod } from '@pdv/shared'
import { FieldError } from '@/components/ui/FieldError'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format-currency'
import { maskMoneyInput } from '@/lib/utils/money'
import type { SplitPart } from '@/stores/cart-store'
import { PaymentMethodPicker } from './PaymentMethodPicker'

const EVEN_SPLIT_OPTIONS = Array.from({ length: MAX_SALE_PAYMENTS - 1 }, (_, index) => index + 2)

interface SplitPaymentProps {
  parts: SplitPart[]
  lastMethod: PaymentMethod | null
  remainderCents: number
  onPartMethodChange: (index: number, method: PaymentMethod) => void
  onPartAmountChange: (index: number, text: string) => void
  onAddPart: () => void
  onRemovePart: (index: number) => void
  onLastMethodChange: (method: PaymentMethod) => void
  onSplitEqually: (people: number) => void
  // Quantidade escolhida em "Dividir igualmente" (null = valores editados à mão).
  evenSplit?: number | null
  // Erro de cada parte (mesma ordem de `parts`), vindo da API.
  partErrors?: { method?: string; amount?: string }[]
  // Erro geral da lista; só aparece se nenhuma parte tem erro próprio.
  partsError?: string
  lastMethodError?: string
}

// Pagamento misto: cada parte tem forma + valor digitado e a última forma
// paga o resto. As formas podem repetir (2 cartões). "Dividir igualmente"
// só preenche os valores; quem valida a soma é a API.
export function SplitPayment({
  parts,
  lastMethod,
  remainderCents,
  onPartMethodChange,
  onPartAmountChange,
  onAddPart,
  onRemovePart,
  onLastMethodChange,
  onSplitEqually,
  evenSplit = null,
  partErrors = [],
  partsError,
  lastMethodError,
}: SplitPaymentProps) {
  const lastTitle = `${parts.length + 1}º pagamento`
  const overpaid = Number.isFinite(remainderCents) && remainderCents <= 0

  return (
    <div className="flex flex-col gap-4" data-cy="split-payment">
      <div role="group" aria-label="Dividir igualmente" className="flex items-center gap-2">
        <span className="font-body text-xs font-semibold text-ink/60">Dividir igualmente por</span>
        {EVEN_SPLIT_OPTIONS.map((people) => (
          <button
            key={people}
            type="button"
            aria-label={`Dividir por ${people}`}
            aria-pressed={evenSplit === people}
            onClick={() => onSplitEqually(people)}
            className={`flex h-8 w-8 items-center justify-center rounded-pill border-[1.5px] font-body text-xs font-bold ${evenSplit === people ? 'border-primary bg-primary text-primary-ink' : 'border-ink bg-surface text-ink'}`}
          >
            {people}
          </button>
        ))}
      </div>

      {parts.map((part, index) => (
        <section key={index} className="flex flex-col gap-2" data-cy="split-part">
          <div className="flex items-baseline justify-between">
            <h3 className="font-body text-sm font-bold">{index + 1}º pagamento</h3>
            {parts.length > 1 && (
              <button
                type="button"
                onClick={() => onRemovePart(index)}
                aria-label={`Remover ${index + 1}º pagamento`}
                className="font-body text-xs font-semibold text-ink/60 underline"
              >
                Remover
              </button>
            )}
          </div>
          <PaymentMethodPicker
            label={`${index + 1}º pagamento`}
            value={part.method}
            onChange={(method) => onPartMethodChange(index, method)}
            error={part.method === null ? partErrors[index]?.method : undefined}
          />
          <Input
            label="Valor"
            leading="R$"
            inputMode="decimal"
            placeholder="0,00"
            name={`partAmount-${index}`}
            value={part.amountText}
            error={partErrors[index]?.amount}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onPartAmountChange(index, maskMoneyInput(event.target.value))
            }
          />
        </section>
      ))}
      <FieldError
        id="split-parts-error"
        message={partErrors.some((error) => error.method || error.amount) ? undefined : partsError}
      />

      {parts.length < MAX_SALE_PAYMENTS - 1 && (
        <button
          type="button"
          onClick={onAddPart}
          className="self-start font-body text-xs font-semibold text-ink underline"
        >
          + Adicionar forma
        </button>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between" data-cy="split-remainder">
          <h3 className="font-body text-sm font-bold">{lastTitle} · o resto</h3>
          <span className={`font-heading text-xl font-bold tracking-tight ${overpaid ? 'text-danger' : ''}`}>
            {Number.isFinite(remainderCents) ? formatCurrency(remainderCents) : '—'}
          </span>
        </div>
        <PaymentMethodPicker
          label={lastTitle}
          value={lastMethod}
          onChange={onLastMethodChange}
          error={lastMethodError}
        />
      </section>
    </div>
  )
}
