import { cartItemCount, cartTotalCents } from '@/lib/utils/cart'
import { useCartStore } from '@/stores/cart-store'

// Carrinho em progresso: estado local (Zustand), sem chamar a API a cada clique.
export function useCart() {
  const store = useCartStore()
  return {
    items: store.items,
    paymentMethod: store.paymentMethod,
    saleUuid: store.saleUuid,
    lastSale: store.lastSale,
    totalCents: cartTotalCents(store.items),
    itemCount: cartItemCount(store.items),
    add: store.add,
    increment: store.increment,
    decrement: store.decrement,
    remove: store.remove,
    setPaymentMethod: store.setPaymentMethod,
    clear: store.clear,
    finish: store.finish,
  }
}
