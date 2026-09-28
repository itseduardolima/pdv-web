import { cartItemCount, cartTotalCents, changeForCash } from '@/lib/utils/cart'
import { parseMoneyInput } from '@/lib/utils/money'
import { useCartStore } from '@/stores/cart-store'

// Carrinho em progresso: estado local (Zustand), sem chamar a API a cada clique.
export function useCart() {
  const store = useCartStore()
  const totalCents = cartTotalCents(store.items)
  // NaN quando vazio/inválido: nada é enviado e a API decide o resto.
  const amountReceivedCents = parseMoneyInput(store.amountReceivedText)
  const partialAmountCents = parseMoneyInput(store.partialAmountText)
  return {
    items: store.items,
    paymentMethod: store.paymentMethod,
    amountReceivedText: store.amountReceivedText,
    amountReceivedCents,
    splitting: store.splitting,
    partialMethod: store.partialMethod,
    partialAmountText: store.partialAmountText,
    partialAmountCents,
    // Resto da 2ª forma; NaN enquanto o valor da 1ª não é válido.
    remainderCents: totalCents - partialAmountCents,
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
    setPartialMethod: store.setPartialMethod,
    setPartialAmountText: store.setPartialAmountText,
    clear: store.clear,
    finish: store.finish,
  }
}
