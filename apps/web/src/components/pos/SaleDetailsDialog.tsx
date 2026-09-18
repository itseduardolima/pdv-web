'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { Sale } from '@pdv/shared'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayLong, formatTime } from '@/lib/utils/format-date'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { PaymentMethodIllustration } from './PaymentMethodIllustration'

interface SaleDetailsDialogProps {
  sale: Sale | null
  onOpenChange: (open: boolean) => void
}

// Histórico de Vendas: a linha da lista só mostra o resumo (hora, forma de
// pagamento, total) — clicar abre aqui o detalhe item a item, preço
// congelado no momento da venda (SaleItem.productName/unitPriceCents).
export function SaleDetailsDialog({ sale, onOpenChange }: SaleDetailsDialogProps) {
  return (
    <Dialog.Root open={sale !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 flex max-h-[85vh] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card border border-border bg-surface p-6 md:p-8">
          {sale && (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-canvas">
                  <PaymentMethodIllustration method={sale.paymentMethod} className="h-6 w-6" />
                </span>
                <div>
                  <Dialog.Title className="font-heading text-lg font-bold tracking-tight">
                    Detalhes da Venda
                  </Dialog.Title>
                  <Dialog.Description className="font-body text-xs text-ink/50">
                    {formatDayLong(new Date(sale.soldAt))} às {formatTime(new Date(sale.soldAt))} · {sale.operatorName}
                  </Dialog.Description>
                </div>
              </div>

              <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
                {sale.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-canvas font-body text-xs font-bold text-ink/60">
                      {item.quantity}x
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body text-sm">{item.productName}</span>
                    <span className="font-body text-sm text-ink/50">{formatCurrency(item.unitPriceCents)}</span>
                    <span className="w-20 shrink-0 text-right font-body text-sm font-semibold">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-1.5 border-t border-border pt-3 font-body text-sm">
                <div className="flex items-center justify-between text-ink/60">
                  <span>Forma de pagamento</span>
                  <span>{PAYMENT_METHOD_LABEL[sale.paymentMethod]}</span>
                </div>
                {sale.amountReceivedCents !== null && (
                  <div className="flex items-center justify-between text-ink/60">
                    <span>Recebido</span>
                    <span>{formatCurrency(sale.amountReceivedCents)}</span>
                  </div>
                )}
                {sale.changeCents !== null && sale.changeCents > 0 && (
                  <div className="flex items-center justify-between text-ink/60">
                    <span>Troco</span>
                    <span>{formatCurrency(sale.changeCents)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 font-heading text-lg font-bold tracking-tight">
                  <span>Total</span>
                  <span>{formatCurrency(sale.totalCents)}</span>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-pill border-[1.5px] border-ink bg-surface px-4 py-2 font-body text-xs font-semibold text-ink"
                >
                  Fechar
                </button>
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
