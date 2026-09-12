import { Input } from './Input'

describe('Input', () => {
  it('renders the API field error below the field and marks it invalid', () => {
    cy.mount(<Input label="Nome do produto" error="Informe o nome do produto" />)
    cy.get('input').should('have.attr', 'aria-invalid', 'true')
    cy.get('[role=alert]').should('have.text', 'Informe o nome do produto')
  })

  it('renders clean without an error', () => {
    cy.mount(<Input label="Nome do produto" leading="R$" />)
    cy.get('input').should('not.have.attr', 'aria-invalid')
    cy.get('[role=alert]').should('not.exist')
    cy.contains('R$')
  })
})
