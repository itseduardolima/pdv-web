import { useState } from 'react'
import { Button, type ButtonState } from '@/components/ui/Button'
import { NumberStepper } from '@/components/ui/NumberStepper'

interface QuickStockAdjustProps {
  productName: string
  initialQuantity: number
  onConfirm: (quantity: number) => void
  onCancel: () => void
  confirmState?: ButtonState
  error?: string
}

// Painel inline (não modal): aparece embaixo do aviso "sem estoque", no
// próprio fluxo da tela — sem overlay, sem sair do carrinho. Mesmo padrão
// visual do bloco de troco (`CashReceived`).
export function QuickStockAdjust({
  productName,
  initialQuantity,
  onConfirm,
  onCancel,
  confirmState = 'idle',
  error,
}: QuickStockAdjustProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  return (
    <div data-cy="quick-stock-adjust" className="flex w-full flex-col gap-3 rounded-input bg-canvas p-3">
      <NumberStepper label={`Estoque · ${productName}`} value={quantity} onChange={setQuantity} error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={() => onConfirm(quantity)} state={confirmState} successLabel="Salvo">
          Salvar
        </Button>
      </div>
    </div>
  )
}
