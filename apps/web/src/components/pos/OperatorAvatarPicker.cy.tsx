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

  it('truncates a very long name to one line instead of wrapping', () => {
    const long = { id: 'op3', name: 'Maria Aparecida da Silva Nascimento Oliveira Costa', photoUrl: null }
    cy.mount(<OperatorAvatarPicker operators={[long]} selectedId={null} onSelect={() => {}} />)
    cy.contains('button', 'Maria Aparecida')
      .should('have.attr', 'title', long.name)
      .find('span.truncate')
      .should('exist')
  })

  it('caps its own height and scrolls instead of pushing content below it down', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `op${i}`, name: `Operador ${i}`, photoUrl: null }))
    cy.mount(<OperatorAvatarPicker operators={many} selectedId={null} onSelect={() => {}} />)
    cy.get('[role=radiogroup]').parent().invoke('outerHeight').should('be.lessThan', 260)
  })

  it('shrinks avatar, font and gap once the team passes the compact threshold', () => {
    const few = Array.from({ length: 6 }, (_, i) => ({ id: `op${i}`, name: `Operador ${i}`, photoUrl: null }))
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `op${i}`, name: `Operador ${i}`, photoUrl: null }))

    cy.mount(<OperatorAvatarPicker operators={few} selectedId={null} onSelect={() => {}} />)
    cy.get('[role=radiogroup]').should('have.class', 'gap-4')
    cy.contains('button', 'Operador 0').find('span[aria-hidden]').should('have.class', 'h-14')

    cy.mount(<OperatorAvatarPicker operators={many} selectedId={null} onSelect={() => {}} />)
    cy.get('[role=radiogroup]').should('have.class', 'gap-2.5')
    cy.contains('button', 'Operador 0').find('span[aria-hidden]').should('have.class', 'h-9')
  })
})
