import type { PaymentMethod } from '@pdv/shared'
import { PAYMENT_METHOD_LABEL } from '@/lib/utils/payment-method'

const SRC: Record<PaymentMethod, string> = {
  CASH: '/icons/payment/cash.svg',
  CARD: '/icons/payment/card.svg',
  PIX: '/icons/payment/pix.svg',
}

// Ilustrações do protótipo para as formas de pagamento (Fechamento de Caixa).
export function PaymentMethodIllustration({ method, className = '' }: { method: PaymentMethod; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- SVG estático em /public
  return <img src={SRC[method]} alt={PAYMENT_METHOD_LABEL[method]} className={className} />
}
