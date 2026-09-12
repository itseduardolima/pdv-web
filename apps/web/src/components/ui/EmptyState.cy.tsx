import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders illustration, title, description and action', () => {
    cy.mount(
      <EmptyState
        title="Nenhum produto"
        description="Cadastre o primeiro."
        action={<a href="/products/new">Novo Produto</a>}
      />,
    )
    cy.get('[data-cy=empty-state] svg').should('exist')
    cy.contains('Nenhum produto')
    cy.contains('Cadastre o primeiro.')
    cy.get('a[href="/products/new"]').should('exist')
  })

  it('paints the box with the tenant primary color', () => {
    cy.mount(
      <div style={{ ['--color-primary' as string]: 'rgb(26, 35, 126)' }}>
        <EmptyState title="Vazio" />
      </div>,
    )
    cy.get('[data-cy=empty-state] svg polygon[fill="var(--empty-box-base)"]')
      .first()
      .then(($el) => {
        expect(getComputedStyle($el[0]).fill).to.eq('rgb(26, 35, 126)')
      })
    cy.get('[data-cy=empty-state] svg path[fill="var(--empty-box-tint)"]')
      .first()
      .then(($el) => {
        // aba: mistura com branco => mais clara que a base
        const [r, g, b] = getComputedStyle($el[0]).fill.match(/\d+/g)!.map(Number)
        expect(r + g + b).to.be.greaterThan(26 + 35 + 126)
      })
  })
})
