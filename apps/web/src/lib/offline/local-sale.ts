import type { DiscountInput, PaymentMethod, Sale } from '@pdv/shared'
import type { CartItem } from '@/lib/utils/cart'

interface BuildLocalSaleInput {
  uuid: string
  items: CartItem[]
  paymentMethod: PaymentMethod
  partialPayments?: { method: PaymentMethod; amountCents: number }[]
  amountReceivedCents: number | null
  changeCents: number | null
  subtotalCents: number
  discountCents: number
  discount: DiscountInput | undefined
  totalCents: number
  cashSessionId: string
  operatorId: string
  operatorName: string
}

// Venda ainda não sincronizada (HU 8.2): a "Venda Confirmada" precisa de um
// objeto no formato de Sale pra renderizar igual, mas o id real e o total
// congelado pela API só existem depois do sync — aqui é só o suficiente pra
// tela mostrar algo coerente enquanto a venda está na fila.
export function buildLocalSale(input: BuildLocalSaleInput): Sale {
  return {
    id: `pending-${input.uuid}`,
    uuid: input.uuid,
    cashSessionId: input.cashSessionId,
    operatorId: input.operatorId,
    operatorName: input.operatorName,
    paymentMethod: input.paymentMethod,
    payments: [
      ...(input.partialPayments ?? []),
      {
        method: input.paymentMethod,
        amountCents: input.totalCents - (input.partialPayments ?? []).reduce((sum, part) => sum + part.amountCents, 0),
      },
    ],
    subtotalCents: input.subtotalCents,
    discountCents: input.discountCents,
    discount: input.discount ?? null,
    totalCents: input.totalCents,
    amountReceivedCents: input.amountReceivedCents,
    changeCents: input.changeCents,
    soldAt: new Date().toISOString(),
    // Na fila local ainda não existe no servidor: nada a anular.
    voidable: false,
    voidedAt: null,
    voidReason: null,
    items: input.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: 0,
    })),
  }
}
