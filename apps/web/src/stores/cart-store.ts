import { create } from 'zustand'
import type { PaymentMethod, Sale } from '@pdv/shared'
import type { CartItem } from '@/lib/utils/cart'

interface CartState {
  items: CartItem[]
  paymentMethod: PaymentMethod | null
  // Só para Dinheiro: quanto o cliente entregou, como o operador digita (mascarado).
  amountReceivedText: string
  // Pagamento misto: 1ª forma + valor; `paymentMethod` paga o resto.
  splitting: boolean
  partialMethod: PaymentMethod | null
  partialAmountText: string
  // uuid da venda em andamento: gerado ao montar o carrinho e reusado em
  // qualquer reenvio, para a API nunca duplicar a venda (idempotência).
  saleUuid: string
  lastSale: Sale | null
  add: (item: Omit<CartItem, 'quantity'>) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  remove: (productId: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountReceivedText: (text: string) => void
  setSplitting: (splitting: boolean) => void
  setPartialMethod: (method: PaymentMethod) => void
  setPartialAmountText: (text: string) => void
  clear: () => void
  finish: (sale: Sale) => void
}

const newUuid = () => crypto.randomUUID()
const emptyPayment = {
  paymentMethod: null,
  amountReceivedText: '',
  splitting: false,
  partialMethod: null,
  partialAmountText: '',
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  ...emptyPayment,
  saleUuid: newUuid(),
  lastSale: null,
  add: (item) =>
    set((state) => {
      const existing = state.items.find((line) => line.productId === item.productId)
      const items = existing
        ? state.items.map((line) =>
            line.productId === item.productId ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...state.items, { ...item, quantity: 1 }]
      return { items }
    }),
  increment: (productId) =>
    set((state) => ({
      items: state.items.map((line) =>
        line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    })),
  decrement: (productId) =>
    set((state) => ({
      items: state.items
        .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0),
    })),
  remove: (productId) => set((state) => ({ items: state.items.filter((line) => line.productId !== productId) })),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountReceivedText: (amountReceivedText) => set({ amountReceivedText }),
  setSplitting: (splitting) =>
    set(splitting ? { splitting } : { splitting, partialMethod: null, partialAmountText: '' }),
  setPartialMethod: (partialMethod) => set({ partialMethod }),
  setPartialAmountText: (partialAmountText) => set({ partialAmountText }),
  // Cancelar só descarta o carrinho — nenhum registro (03-regras-negocio § Venda).
  clear: () => set({ items: [], ...emptyPayment, saleUuid: newUuid() }),
  finish: (sale) => set({ items: [], ...emptyPayment, saleUuid: newUuid(), lastSale: sale }),
}))
