'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState } from 'react'
import { Button, type ButtonState } from '@/components/ui/Button'
import { NumberStepper } from '@/components/ui/NumberStepper'

interface QuickStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  initialQuantity: number
  onConfirm: (quantity: number) => void
  confirmState?: ButtonState
  error?: string
}

// Atalho para corrigir o estoque sem sair da venda (ex.: produto cadastrado
// com estoque zerado por engano). Mesmo padrão do ConfirmDialog (Radix
// Dialog), com um NumberStepper no lugar da descrição.
export function QuickStockDialog({
  open,
  onOpenChange,
  productName,
  initialQuantity,
  onConfirm,
  confirmState = 'idle',
  error,
}: QuickStockDialogProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  // Reabrir para outro produto (ou reabrir o mesmo) recomeça do estoque sugerido.
  useEffect(() => {
    if (open) setQuantity(initialQuantity)
  }, [open, initialQuantity])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card bg-surface p-6 md:p-8">
          <div>
            <Dialog.Title className="font-heading text-xl font-bold tracking-tight">Ajustar estoque</Dialog.Title>
            <Dialog.Description className="mt-1 font-body text-sm text-ink/60">{productName}</Dialog.Description>
          </div>
          <NumberStepper label="Estoque atual" value={quantity} onChange={setQuantity} error={error} />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
            <Button onClick={() => onConfirm(quantity)} state={confirmState} successLabel="Salvo">
              Salvar e continuar
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancelar</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
