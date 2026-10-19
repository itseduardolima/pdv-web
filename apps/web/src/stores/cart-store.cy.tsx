import { useCartStore } from './cart-store'

describe('cart-store — pagamento dividido', () => {
  beforeEach(() => {
    useCartStore.getState().clear()
  })

  it('leaves the split mode when the last part is removed', () => {
    const store = useCartStore.getState()
    store.setSplitting(true)
    expect(useCartStore.getState().parts).to.have.length(1)
    useCartStore.getState().removePart(0)
    expect(useCartStore.getState().parts).to.have.length(0)
    expect(useCartStore.getState().splitting).to.eq(false)
  })

  it('stays in split mode while parts remain', () => {
    useCartStore.getState().setSplitting(true)
    useCartStore.getState().addPart()
    useCartStore.getState().removePart(0)
    expect(useCartStore.getState().parts).to.have.length(1)
    expect(useCartStore.getState().splitting).to.eq(true)
  })

  it('never goes above MAX_SALE_PAYMENTS - 1 explicit parts', () => {
    useCartStore.getState().setSplitting(true)
    for (let i = 0; i < 10; i += 1) useCartStore.getState().addPart()
    expect(useCartStore.getState().parts).to.have.length(4)
  })

  describe('evenSplit (quantidade marcada em "Dividir igualmente")', () => {
    const cartWithItem = () => {
      useCartStore.getState().add({ productId: 'p1', name: 'Arroz', unit: 'UN', unitPriceCents: 3000 })
      useCartStore.getState().setSplitting(true)
    }

    it('remembers the chosen quantity', () => {
      cartWithItem()
      useCartStore.getState().splitEqually(3)
      expect(useCartStore.getState().evenSplit).to.eq(3)
      expect(useCartStore.getState().parts.map((part) => part.amountText)).to.deep.equal(['10,00', '10,00'])
    })

    it('clears when an amount is edited by hand', () => {
      cartWithItem()
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().setPartAmountText(0, '12,00')
      expect(useCartStore.getState().evenSplit).to.eq(null)
    })

    it('clears when parts are added or removed, or the split mode is toggled', () => {
      cartWithItem()
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().addPart()
      expect(useCartStore.getState().evenSplit).to.eq(null)
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().removePart(0)
      expect(useCartStore.getState().evenSplit).to.eq(null)
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().setSplitting(false)
      expect(useCartStore.getState().evenSplit).to.eq(null)
    })

    it('clears when the cart items change (the amounts would be stale)', () => {
      cartWithItem()
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().increment('p1')
      expect(useCartStore.getState().evenSplit).to.eq(null)
    })

    it('keeps the selection when only a payment method changes', () => {
      cartWithItem()
      useCartStore.getState().splitEqually(3)
      useCartStore.getState().setPartMethod(0, 'PIX')
      useCartStore.getState().setPaymentMethod('CASH')
      expect(useCartStore.getState().evenSplit).to.eq(3)
    })
  })
})

describe('cart-store — desconto', () => {
  beforeEach(() => {
    useCartStore.getState().clear()
    useCartStore.getState().add({ productId: 'p1', name: 'Arroz', unit: 'UN', unitPriceCents: 3000 })
  })

  it('splits equally over the discounted total', () => {
    useCartStore.getState().setDiscountText('3,00')
    useCartStore.getState().setSplitting(true)
    useCartStore.getState().splitEqually(3)
    expect(useCartStore.getState().parts.map((part) => part.amountText)).to.deep.equal(['9,00', '9,00'])
  })

  it('clears the text when the type changes, so R$ and % never get mixed up', () => {
    useCartStore.getState().setDiscountText('10')
    useCartStore.getState().setDiscountType('PERCENT')
    expect(useCartStore.getState().discountText).to.eq('')
    expect(useCartStore.getState().discountType).to.eq('PERCENT')
  })

  it('drops the discount when the cart is cleared or the sale finishes', () => {
    useCartStore.getState().setDiscountType('PERCENT')
    useCartStore.getState().setDiscountText('10')
    useCartStore.getState().clear()
    expect(useCartStore.getState().discountText).to.eq('')
    expect(useCartStore.getState().discountType).to.eq('AMOUNT')
  })
})
