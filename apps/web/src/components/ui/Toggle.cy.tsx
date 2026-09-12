import { useState } from 'react'
import { Toggle } from './Toggle'

function Harness() {
  const [on, setOn] = useState(false)
  return <Toggle checked={on} onChange={setOn} label="Operador ativo" />
}

describe('Toggle', () => {
  it('is an accessible switch that flips on click', () => {
    cy.mount(<Harness />)
    cy.get('[role=switch]').should('have.attr', 'aria-checked', 'false').click()
    cy.get('[role=switch]').should('have.attr', 'aria-checked', 'true').and('have.attr', 'aria-label', 'Operador ativo')
  })

  it('does nothing while disabled', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<Toggle checked onChange={onChange} label="x" disabled />)
    cy.get('[role=switch]').should('be.disabled')
  })
})
