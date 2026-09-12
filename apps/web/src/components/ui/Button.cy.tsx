import { Button } from './Button'

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    cy.mount(<Button state="loading">Salvar</Button>)
    cy.get('button').should('be.disabled').and('have.attr', 'aria-busy', 'true').and('contain', 'Salvar')
  })

  it('shows the success label with a check instead of the children', () => {
    cy.mount(
      <Button state="success" successLabel="Salvo">
        Salvar
      </Button>,
    )
    cy.get('button').should('contain', 'Salvo').and('not.contain', 'Salvar').find('svg').should('exist')
  })

  it('renders as a link when href is given', () => {
    cy.mount(<Button href="/products/new">Novo</Button>)
    cy.get('a').should('have.attr', 'href', '/products/new')
  })
})
