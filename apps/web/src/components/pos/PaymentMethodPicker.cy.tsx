import { PaymentMethodPicker } from './PaymentMethodPicker'

describe('PaymentMethodPicker', () => {
  it('lists the three methods and emits the chosen one', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<PaymentMethodPicker value={null} onChange={onChange} />)
    cy.get('[role=radio]').should('have.length', 3)
    cy.contains('[role=radio]', 'Pix').click()
    cy.get('@onChange').should('have.been.calledWith', 'PIX')
  })

  it('marks the selected method and shows the API error when none was chosen', () => {
    cy.mount(<PaymentMethodPicker value="CARD" onChange={() => {}} error="Escolha a forma de pagamento" />)
    cy.get('[role=radio][aria-checked=true]').should('contain', 'Cartão')
    cy.get('[role=alert]').should('have.text', 'Escolha a forma de pagamento')
  })
})
