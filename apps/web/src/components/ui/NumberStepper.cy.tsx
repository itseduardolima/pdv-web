import { useState } from 'react'
import { NumberStepper } from './NumberStepper'

function Harness() {
  const [value, setValue] = useState(3)
  return <NumberStepper label="Estoque atual" value={value} onChange={setValue} />
}

describe('NumberStepper', () => {
  it('steps with the buttons and accepts typed digits', () => {
    cy.mount(<Harness />)
    cy.get('button[aria-label=Aumentar]').click()
    cy.get('input').should('have.value', '4')
    cy.get('input').clear().type('42')
    cy.get('input').should('have.value', '42')
    cy.get('button[aria-label=Diminuir]').click()
    cy.get('input').should('have.value', '41')
    cy.get('input').clear().type('abc')
    cy.get('input').should('have.value', '0')
  })
})
