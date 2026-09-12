import type { ChangeEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format-currency'
import { maskMoneyInput } from '@/lib/utils/money'

interface CashReceivedProps {
  value: string
  onChange: (text: string) => void
  changeCents: number | null
  error?: string
}

// Venda em Dinheiro: quanto o cliente entregou e o troco a devolver, ao vivo.
// Opcional — sem valor, nada é enviado. Recebido menor que o total só avisa;
// quem recusa é a API.
export function CashReceived({ value, onChange, changeCents, error }: CashReceivedProps) {
  const short = changeCents !== null && changeCents < 0
  return (
    <div className="flex flex-col gap-2 rounded-input bg-canvas p-3" data-cy="cash-received">
      <Input
        label="Valor recebido"
        leading="R$"
        inputMode="decimal"
        placeholder="0,00"
        hint="Opcional · quanto o cliente entregou"
        name="amountReceived"
        value={value}
        error={error}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(maskMoneyInput(event.target.value))}
        className="[&>div]:bg-surface"
      />
      {changeCents !== null && (
        <p
          data-cy="cash-change"
          className={`flex items-baseline justify-between font-body text-sm ${short ? 'text-danger' : 'text-ink'}`}
        >
          <span className="font-medium">{short ? 'Faltam' : 'Troco'}</span>
          <span className="font-heading text-xl font-bold tracking-tight">{formatCurrency(Math.abs(changeCents))}</span>
        </p>
      )}
    </div>
  )
}
