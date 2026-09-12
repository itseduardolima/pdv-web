import type { Operator } from '@pdv/shared'
import { OperatorCard } from './OperatorCard'

const operator: Operator = {
  id: 'o1',
  name: 'Maria Souza',
  role: 'OPERATOR',
  active: true,
  photoUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('OperatorCard', () => {
  it('shows name, role as plain text and an active toggle that reports the new value', () => {
    const onActiveChange = cy.stub().as('onActiveChange')
    cy.mount(<OperatorCard operator={operator} editHref="/operators/o1/edit" onActiveChange={onActiveChange} />)
    cy.contains('Maria Souza')
    cy.contains('Operador')
    cy.get('[role=switch]').should('have.attr', 'aria-checked', 'true').click()
    cy.get('@onActiveChange').should('have.been.calledWith', false)
    cy.get('a[aria-label="Editar Maria Souza"]').should('have.attr', 'href', '/operators/o1/edit')
  })

  it('marks an inactive operator', () => {
    cy.mount(<OperatorCard operator={{ ...operator, active: false }} editHref="/x" onActiveChange={() => undefined} />)
    cy.contains('inativo')
    cy.get('[role=switch]').should('have.attr', 'aria-checked', 'false')
  })
})
