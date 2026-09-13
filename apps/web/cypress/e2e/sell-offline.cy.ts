// HU 8.1: o catálogo continua disponível em Vender quando a API some
// (rede caiu ou backend fora). Simulado derrubando só as rotas de produto —
// o resto da página segue vindo do Next normalmente.
describe('Vender sem rede: catálogo em cache', () => {
  it('lists the cached products and still adds them to the cart when the API is unreachable', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    // 1) online: a lista completa é sincronizada pro IndexedDB
    cy.visit('/sell')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').should('be.visible')

    // 2) API fora do ar: só produtos e categorias falham
    cy.intercept('GET', '**/products/categories', { forceNetworkError: true }).as('categoriesOffline')
    cy.intercept('GET', '**/products', { forceNetworkError: true }).as('productsOffline')
    cy.intercept('GET', '**/products?*', { forceNetworkError: true })

    cy.visit('/sell')
    cy.wait('@productsOffline')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').should('be.visible').click()
    cy.get('[data-cy=cart-line]').should('have.length', 1).and('contain', 'Arroz')
    cy.contains('[role=alert]', 'Falha ao comunicar').should('not.exist')

    // categorias e busca saem do cache também
    cy.wait('@categoriesOffline')
    cy.contains('Estiva').should('exist')
    cy.get('input[aria-label="Buscar produto ou código de barras"]').type('Arroz')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').should('be.visible')
    cy.get('button[aria-label^="Adicionar"]').each(($button) => {
      expect($button.attr('aria-label')).to.match(/Arroz/)
    })
  })
})
