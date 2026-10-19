import { create } from 'zustand'
import { MAX_SALE_PAYMENTS, type DiscountType, type PaymentMethod, type Sale } from '@pdv/shared'
import { cartTotalCents, splitEvenly, type CartItem } from '@/lib/utils/cart'
import { previewDiscountCents } from '@/lib/utils/discount'
import { formatMoneyMasked } from '@/lib/utils/money'

// Parte do pagamento misto com valor digitado; a forma em `paymentMethod`
// paga o resto.
export interface SplitPart {
  method: PaymentMethod | null
  amountText: string
}

interface CartState {
  items: CartItem[]
  discountType: DiscountType
  discountText: string
  paymentMethod: PaymentMethod | null
  // Só para Dinheiro: quanto o cliente entregou, como o operador digita (mascarado).
  amountReceivedText: string
  // Pagamento misto: partes com valor + `paymentMethod` pagando o resto.
  splitting: boolean
  parts: SplitPart[]
  // Quantas pessoas o "Dividir igualmente" usou; null assim que os valores
  // deixam de ser iguais (edição manual, mais/menos partes, itens mudaram).
  evenSplit: number | null
  // uuid da venda em andamento: gerado ao montar o carrinho e reusado em
  // qualquer reenvio, para a API nunca duplicar a venda (idempotência).
  saleUuid: string
  lastSale: Sale | null
  add: (item: Omit<CartItem, 'quantity'>) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  remove: (productId: string) => void
  setDiscountType: (type: DiscountType) => void
  setDiscountText: (text: string) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setAmountReceivedText: (text: string) => void
  setSplitting: (splitting: boolean) => void
  addPart: () => void
  removePart: (index: number) => void
  setPartMethod: (index: number, method: PaymentMethod) => void
  setPartAmountText: (index: number, text: string) => void
  splitEqually: (people: number) => void
  clear: () => void
  finish: (sale: Sale) => void
}

const newUuid = () => crypto.randomUUID()
const emptyPayment = {
  discountType: 'AMOUNT' as DiscountType,
  discountText: '',
  paymentMethod: null,
  amountReceivedText: '',
  splitting: false,
  parts: [] as SplitPart[],
  evenSplit: null as number | null,
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
      return { items, evenSplit: null }
    }),
  increment: (productId) =>
    set((state) => ({
      items: state.items.map((line) =>
        line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
      evenSplit: null,
    })),
  decrement: (productId) =>
    set((state) => ({
      items: state.items
        .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0),
      evenSplit: null,
    })),
  remove: (productId) =>
    set((state) => ({ items: state.items.filter((line) => line.productId !== productId), evenSplit: null })),
  setDiscountType: (discountType) => set({ discountType, discountText: '', evenSplit: null }),
  setDiscountText: (discountText) => set({ discountText, evenSplit: null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setAmountReceivedText: (amountReceivedText) => set({ amountReceivedText }),
  setSplitting: (splitting) =>
    set({ splitting, parts: splitting ? [{ method: null, amountText: '' }] : [], evenSplit: null }),
  addPart: () =>
    set((state) =>
      state.parts.length < MAX_SALE_PAYMENTS - 1
        ? { parts: [...state.parts, { method: null, amountText: '' }], evenSplit: null }
        : state,
    ),
  // Sem partes sobrando não há o que dividir: volta ao pagamento simples.
  removePart: (index) =>
    set((state) => {
      const parts = state.parts.filter((_, i) => i !== index)
      return { parts, splitting: parts.length > 0, evenSplit: null }
    }),
  setPartMethod: (index, method) =>
    set((state) => ({ parts: state.parts.map((part, i) => (i === index ? { ...part, method } : part)) })),
  setPartAmountText: (index, amountText) =>
    set((state) => ({
      parts: state.parts.map((part, i) => (i === index ? { ...part, amountText } : part)),
      evenSplit: null,
    })),
  // N pessoas = N-1 partes com valor + a forma do resto (que leva a sobra).
  splitEqually: (people) =>
    set((state) => {
      const subtotalCents = cartTotalCents(state.items)
      const discountCents = previewDiscountCents(subtotalCents, state.discountType, state.discountText)
      const amounts = splitEvenly(subtotalCents - discountCents, people)
      return {
        parts: amounts.slice(0, -1).map((cents, i) => ({
          method: state.parts[i]?.method ?? null,
          amountText: formatMoneyMasked(cents),
        })),
        evenSplit: people,
      }
    }),
  // Cancelar só descarta o carrinho — nenhum registro (03-regras-negocio § Venda).
  clear: () => set({ items: [], ...emptyPayment, saleUuid: newUuid() }),
  finish: (sale) => set({ items: [], ...emptyPayment, saleUuid: newUuid(), lastSale: sale }),
}))
