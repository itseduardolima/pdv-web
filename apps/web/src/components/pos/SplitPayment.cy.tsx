import { SplitPayment } from './SplitPayment'

const noop = () => {}

describe('SplitPayment', () => {
  it('shows the remainder and lets the second method repeat the first (2 cards)', () => {
    cy.mount(
      <SplitPayment
        firstMethod="PIX"
        firstAmountText="30,00"
        secondMethod={null}
        remainderCents={2000}
        onFirstMethodChange={noop}
        onFirstAmountChange={noop}
        onSecondMethodChange={noop}
      />,
    )
    cy.get('[data-cy=split-remainder]')
      .invoke('text')
      .should('match', /R\$\s20,00/)
    cy.contains('h3', '1º pagamento')
    cy.contains('h3', '2º pagamento')
    cy.get('[aria-label="2º pagamento"] [role=radio]').should('have.length', 3)
  })

  it('emits the masked amount typed for the first method', () => {
    const onFirstAmountChange = cy.stub().as('onFirstAmountChange')
    cy.mount(
      <SplitPayment
        firstMethod="PIX"
        firstAmountText=""
        secondMethod="CASH"
        remainderCents={NaN}
        onFirstMethodChange={noop}
        onFirstAmountChange={onFirstAmountChange}
        onSecondMethodChange={noop}
      />,
    )
    cy.get('[data-cy=split-remainder]').should('contain', '—')
    cy.get('input[name=partialAmount]').type('1500')
    cy.get('@onFirstAmountChange').should('have.been.calledWith', '0,01')
  })
})
