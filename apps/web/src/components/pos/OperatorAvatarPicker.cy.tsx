import { OperatorAvatarPicker } from './OperatorAvatarPicker'

const operators = [
  { id: 'op1', name: 'Karol Almeida', photoUrl: null },
  { id: 'op2', name: 'Rafael', photoUrl: null },
]

describe('OperatorAvatarPicker', () => {
  it('renders initials and emits the selected operator id', () => {
    const onSelect = cy.stub().as('onSelect')
    cy.mount(<OperatorAvatarPicker operators={operators} selectedId={null} onSelect={onSelect} />)

    cy.contains('KA').should('exist')
    cy.contains('RA').should('exist')
    cy.contains('button', 'Rafael').click()
    cy.get('@onSelect').should('have.been.calledWith', 'op2')
  })

  it('marks the selected operator as checked', () => {
    cy.mount(<OperatorAvatarPicker operators={operators} selectedId="op1" onSelect={() => {}} />)
    cy.get('[role=radio][aria-checked=true]').should('have.length', 1).and('contain', 'Karol Almeida')
  })
})
