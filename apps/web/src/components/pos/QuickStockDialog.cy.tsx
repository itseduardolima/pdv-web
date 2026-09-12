import { useState } from 'react'
import { QuickStockDialog } from './QuickStockDialog'

function Harness({ onConfirm }: { onConfirm: (quantity: number) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <QuickStockDialog
      open={open}
      onOpenChange={setOpen}
      productName="Arroz 5kg"
      initialQuantity={3}
      onConfirm={onConfirm}
    />
  )
}

describe('QuickStockDialog', () => {
  it('starts at the suggested quantity, lets it be adjusted, and confirms with the new value', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(<Harness onConfirm={onConfirm} />)
    cy.contains('Ajustar estoque')
    cy.contains('Arroz 5kg')
    cy.get('input').should('have.value', '3')
    cy.get('button[aria-label=Aumentar]').click().click()
    cy.get('input').should('have.value', '5')
    cy.contains('button', 'Salvar e continuar').click()
    cy.get('@onConfirm').should('have.been.calledWith', 5)
  })

  it('shows a field error from the API without closing the dialog', () => {
    cy.mount(
      <QuickStockDialog
        open
        onOpenChange={() => undefined}
        productName="Arroz 5kg"
        initialQuantity={3}
        onConfirm={() => undefined}
        error="A quantidade não pode ser negativa"
      />,
    )
    cy.contains('A quantidade não pode ser negativa')
  })
})
