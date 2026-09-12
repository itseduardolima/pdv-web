import { ProductCard } from './ProductCard'

const product = {
  id: 'p1',
  name: 'Cerveja Lata 350ml',
  category: 'Bebidas',
  unit: 'UN' as const,
  barcode: '7891149010202',
  salePriceCents: 399,
  costPriceCents: 260,
  stockQuantity: 120,
  minStock: 24,
  photoUrl: null,
}

describe('ProductCard', () => {
  it('shows name, barcode, formatted price and normal stock', () => {
    cy.mount(<ProductCard product={product} editHref="/products/p1/edit" />)
    cy.contains('Cerveja Lata 350ml')
    cy.contains('7891149010202')
    cy.contains('R$ 3,99')
    cy.get('[data-cy=stock-ok]').should('contain', '120 un')
    cy.get('a[aria-label="Editar Cerveja Lata 350ml"]').should('have.attr', 'href', '/products/p1/edit')
  })

  it('flags low stock when quantity is at or below the minimum', () => {
    cy.mount(<ProductCard product={{ ...product, stockQuantity: 4 }} />)
    cy.get('[data-cy=stock-low]').should('contain', '4 un')
    cy.get('a').should('not.exist')
  })
})
