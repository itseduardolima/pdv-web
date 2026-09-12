import { create } from 'zustand'
import type { PaymentMethod, Sale } from '@pdv/shared'
import type { CartItem } from '@/lib/utils/cart'

interface CartState {
  items: CartItem[]
  paymentMethod: PaymentMethod | null
  // uuid da venda em andamento: gerado ao montar o carrinho e reusado em
  // qualquer reenvio, para a API nunca duplicar a venda (idempotência).
  saleUuid: string
  lastSale: Sale | null
  add: (item: Omit<CartItem, 'quantity'>) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  remove: (productId: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  clear: () => void
  finish: (sale: Sale) => void
}

const newUuid = () => crypto.randomUUID()

export const useCartStore = create<CartState>((set) => ({
  items: [],
  paymentMethod: null,
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
  // Cancelar só descarta o carrinho — nenhum registro (03-regras-negocio § Venda).
  clear: () => set({ items: [], paymentMethod: null, saleUuid: newUuid() }),
  finish: (sale) => set({ items: [], paymentMethod: null, saleUuid: newUuid(), lastSale: sale }),
}))
