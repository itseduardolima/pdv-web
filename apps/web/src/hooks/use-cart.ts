import { cartItemCount, cartTotalCents, changeForCash } from '@/lib/utils/cart'
import { parseMoneyInput } from '@/lib/utils/money'
import { useCartStore } from '@/stores/cart-store'

// Carrinho em progresso: estado local (Zustand), sem chamar a API a cada clique.
export function useCart() {
  const store = useCartStore()
  const totalCents = cartTotalCents(store.items)
  // NaN quando vazio/inválido: nada é enviado e a API decide o resto.
  const amountReceivedCents = parseMoneyInput(store.amountReceivedText)
  const partsCents = store.parts.map((part) => parseMoneyInput(part.amountText))
  return {
    items: store.items,
    paymentMethod: store.paymentMethod,
    amountReceivedText: store.amountReceivedText,
    amountReceivedCents,
    splitting: store.splitting,
    parts: store.parts,
    evenSplit: store.evenSplit,
    // O que vai para a API; forma vazia segue como '' e a API responde o erro.
    partialPayments: store.splitting
      ? store.parts.map((part) => ({
          method: part.method ?? ('' as never),
          amountCents: parseMoneyInput(part.amountText),
        }))
      : undefined,
    // Resto da última forma; NaN enquanto algum valor não é válido.
    remainderCents: totalCents - partsCents.reduce((sum, cents) => sum + cents, 0),
    // Sem troco no pagamento misto.
    changeCents: store.splitting ? null : changeForCash(store.paymentMethod, amountReceivedCents, totalCents),
    saleUuid: store.saleUuid,
    lastSale: store.lastSale,
    totalCents,
    itemCount: cartItemCount(store.items),
    add: store.add,
    increment: store.increment,
    decrement: store.decrement,
    remove: store.remove,
    setPaymentMethod: store.setPaymentMethod,
    setAmountReceivedText: store.setAmountReceivedText,
    setSplitting: store.setSplitting,
    addPart: store.addPart,
    removePart: store.removePart,
    setPartMethod: store.setPartMethod,
    setPartAmountText: store.setPartAmountText,
    splitEqually: store.splitEqually,
    clear: store.clear,
    finish: store.finish,
  }
}
