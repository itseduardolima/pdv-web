'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Calculator } from './Calculator'

interface CalculatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Calculadora solta pra ajudar a dividir a conta com o cliente no balcão —
// sem ligação com carrinho, venda ou API (mesmo padrão de Dialog do
// ConfirmDialog).
export function CalculatorDialog({ open, onOpenChange }: CalculatorDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 w-[calc(100%-32px)] max-w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-heading text-xl font-bold tracking-tight">Calculadora</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="font-body text-xl font-bold text-ink/50">
              ×
            </Dialog.Close>
          </div>
          <Calculator />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
