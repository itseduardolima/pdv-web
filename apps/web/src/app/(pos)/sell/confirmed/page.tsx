'use client'

import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Button } from '@/components/ui/Button'
import { CardIcon, CashIcon, CheckCircleIcon, PixIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'
import { useSaleConfirmedPage } from './use-sale-confirmed-page'

const ICONS = { CASH: CashIcon, CARD: CardIcon, PIX: PixIcon }

export default function SaleConfirmedPage() {
  const page = useSaleConfirmedPage()
  const sale = page.sale
  if (!sale) return null
  const PaymentIcon = ICONS[sale.paymentMethod]

  return (
    <SplitAuthLayout illustrationSrc="/login-illustration.png">
      <span className="flex h-[60px] w-[60px] items-center justify-center rounded-pill bg-primary text-primary-ink md:h-[76px] md:w-[76px]">
        <CheckCircleIcon aria-hidden />
      </span>
      <h1 className="font-heading text-[21px] font-bold tracking-tight md:text-[26px]">Venda finalizada!</h1>
      <div className="text-center">
        <p className="font-body text-xs font-medium text-ink/50 md:text-[13px]">Total pago</p>
        <p className="font-heading text-[34px] font-bold tracking-tight md:text-[44px]">
          {formatCurrency(sale.totalCents)}
        </p>
      </div>
      <span className="flex items-center gap-2 rounded-pill bg-primary px-4 py-2 font-body text-xs font-semibold text-primary-ink md:text-[13px]">
        <PaymentIcon aria-hidden width="14" height="14" />
        Pago com {PAYMENT_METHOD_LABEL[sale.paymentMethod]}
      </span>

      <hr className="w-full border-border" />

      <ul className="flex w-full flex-col gap-2 md:gap-2.5">
        {sale.items.map((item) => (
          <li key={item.productId} className="flex justify-between font-body text-xs md:text-[13px]">
            <span className="text-ink/60">
              {item.quantity}x {item.productName}
            </span>
            <span className="font-semibold">{formatCurrency(item.quantity * item.unitPriceCents)}</span>
          </li>
        ))}
        <li className="mt-1 flex justify-between font-body text-sm font-bold md:text-[15px]">
          <span>Total</span>
          <span>{formatCurrency(sale.totalCents)}</span>
        </li>
      </ul>

      <hr className="w-full border-border" />

      <Button onClick={page.handleNewSale} className="w-full">
        Nova Venda
      </Button>
    </SplitAuthLayout>
  )
}
