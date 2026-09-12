import { Input } from './Input'

describe('Input', () => {
  it('renders the API field error below the field and marks it invalid', () => {
    cy.mount(<Input label="Nome do produto" error="Informe o nome do produto" hint="De 2 a 120 caracteres" />)
    cy.get('input').should('have.attr', 'aria-invalid', 'true')
    cy.get('[role=alert]').should('have.text', 'Informe o nome do produto')
    cy.contains('De 2 a 120 caracteres').should('not.exist')
  })

  it('renders hint and required mark without an error', () => {
    cy.mount(<Input label="Nome do produto" required hint="De 2 a 120 caracteres" leading="R$" />)
    cy.get('input').should('not.have.attr', 'aria-invalid')
    cy.get('[role=alert]').should('not.exist')
    cy.contains('label', 'Nome do produto').should('contain', '*')
    cy.contains('De 2 a 120 caracteres')
    cy.contains('R$')
  })
})
