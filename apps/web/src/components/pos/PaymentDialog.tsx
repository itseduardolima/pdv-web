'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useRef, type ReactNode } from 'react'
import { Button, type ButtonState } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/format-currency'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalCents: number
  onConfirm: () => void
  confirmState?: ButtonState
  // Muda a cada aviso novo (tentativa que falhou, painel de ajuste aberto):
  // o miolo rola sozinho até ele, senão o erro nasce fora da tela.
  alertKey?: string
  children: ReactNode
}

// Tela só de pagamento (modal): o carrinho fica enxuto e aqui cabe qualquer
// divisão. Cabeçalho e botões fixos, só o miolo rola. Celular: folha na parte
// de baixo com a altura do conteúdo (sem vão no meio); desktop/tablet: centralizado.
export function PaymentDialog({
  open,
  onOpenChange,
  totalCents,
  onConfirm,
  confirmState = 'idle',
  alertKey,
  children,
}: PaymentDialogProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!alertKey) return
    const body = bodyRef.current
    // Painel de ajuste de estoque, se aberto; senão o 1º aviso (na ordem da tela).
    const target = body?.querySelector('[data-cy=quick-stock-adjust]') ?? body?.querySelector('[role=alert]')
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [alertKey])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content
          data-cy="payment-dialog"
          className="fixed inset-x-0 bottom-0 z-30 flex max-h-[92dvh] flex-col rounded-t-card bg-surface md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[90vh] md:w-[calc(100%-32px)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:border md:border-border"
        >
          <header className="flex shrink-0 items-baseline justify-between gap-3 border-b border-border p-4 md:p-6">
            <Dialog.Title className="font-heading text-xl font-bold tracking-tight">Pagamento</Dialog.Title>
            <Dialog.Description className="sr-only">
              Escolha como o cliente vai pagar e finalize a venda.
            </Dialog.Description>
            <p className="flex items-baseline gap-2 font-body text-sm font-medium">
              Total
              <span className="font-heading text-2xl font-bold tracking-tight">{formatCurrency(totalCents)}</span>
            </p>
          </header>

          <div ref={bodyRef} className="flex min-h-0 flex-initial flex-col gap-4 overflow-y-auto p-4 md:p-6">
            {children}
          </div>

          <footer className="flex shrink-0 flex-col gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row-reverse md:p-6">
            <Button onClick={onConfirm} state={confirmState} className="w-full sm:flex-1">
              Finalizar Venda
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={confirmState === 'loading'} className="w-full sm:w-auto">
                Voltar
              </Button>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
