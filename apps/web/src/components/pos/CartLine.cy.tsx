import { CartLine } from './CartLine'

const item = { productId: 'p1', name: 'Cerveja Lata 350ml', unit: 'UN', unitPriceCents: 399, quantity: 6 }

describe('CartLine', () => {
  it('shows name, unit price, quantity and line total, and emits stepper events', () => {
    const onIncrement = cy.stub().as('inc')
    const onDecrement = cy.stub().as('dec')
    cy.mount(
      <ul>
        <CartLine item={item} onIncrement={onIncrement} onDecrement={onDecrement} />
      </ul>,
    )
    cy.contains('Cerveja Lata 350ml')
    cy.contains('R$ 3,99 / un')
    cy.get('output').should('have.text', '6')
    cy.contains('R$ 23,94')
    cy.get('button[aria-label="Aumentar Cerveja Lata 350ml"]').click()
    cy.get('@inc').should('have.been.calledWith', 'p1')
    cy.get('button[aria-label="Diminuir Cerveja Lata 350ml"]').click()
    cy.get('@dec').should('have.been.calledWith', 'p1')
  })

  it('highlights the line the API flagged', () => {
    cy.mount(
      <ul>
        <CartLine item={item} onIncrement={() => {}} onDecrement={() => {}} highlighted />
      </ul>,
    )
    cy.get('[data-cy=cart-line]').should('have.attr', 'data-highlighted', 'true')
  })
})
