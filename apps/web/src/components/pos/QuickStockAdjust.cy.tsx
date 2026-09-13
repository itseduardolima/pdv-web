import { QuickStockAdjust } from './QuickStockAdjust'

describe('QuickStockAdjust', () => {
  it('starts at the suggested quantity, lets it be adjusted, and confirms with the new value', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(
      <QuickStockAdjust productName="Arroz 5kg" initialQuantity={3} onConfirm={onConfirm} onCancel={() => undefined} />,
    )
    cy.contains('Estoque · Arroz 5kg')
    cy.get('input').should('have.value', '3')
    cy.get('button[aria-label=Aumentar]').click().click()
    cy.get('input').should('have.value', '5')
    cy.contains('button', 'Salvar').click()
    cy.get('@onConfirm').should('have.been.calledWith', 5)
  })

  it('calls onCancel without confirming', () => {
    const onCancel = cy.stub().as('onCancel')
    cy.mount(
      <QuickStockAdjust productName="Arroz 5kg" initialQuantity={3} onConfirm={() => undefined} onCancel={onCancel} />,
    )
    cy.contains('button', 'Cancelar').click()
    cy.get('@onCancel').should('have.been.calledOnce')
  })

  it('shows a field error from the API without losing the typed value', () => {
    cy.mount(
      <QuickStockAdjust
        productName="Arroz 5kg"
        initialQuantity={3}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        error="A quantidade não pode ser negativa"
      />,
    )
    cy.contains('A quantidade não pode ser negativa')
    cy.get('input').should('have.value', '3')
  })
})
