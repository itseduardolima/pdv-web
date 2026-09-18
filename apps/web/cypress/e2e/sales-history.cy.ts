// Histórico de Vendas: filtro por dia (Hoje/Ontem/Escolher dia) e busca por
// produto vendido. Admin e Operador acessam (sem @Roles no backend).
describe('Histórico de Vendas', () => {
  it("lists today's sale (one more than before) and filters by product", () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/history')
    cy.contains('h1', 'Histórico de Vendas')
    cy.contains('button[aria-pressed]', 'Hoje').should('have.attr', 'aria-pressed', 'true')
    cy.get('ul li')
      .its('length')
      .then((before) => {
        cy.visit('/sell')
        cy.get('button[aria-label="Adicionar Sal Refinado 1kg"]').click()
        cy.contains('[role=radio]', 'Cartão').click()
        cy.contains('button', 'Finalizar Venda').click()
        cy.location('pathname').should('eq', '/sell/confirmed')
        cy.contains('button', 'Nova Venda').click()

        cy.visit('/history')
        cy.get('ul li').should('have.length', before + 1)
      })

    // "Ontem" troca o período e busca sem erro (o dev DB acumula vendas de
    // execuções anteriores, então não dá pra garantir "vazio" com dados
    // reais — a garantia de filtro vazio vem da busca por produto abaixo).
    cy.contains('button[aria-pressed]', 'Ontem').click()
    cy.contains('button[aria-pressed]', 'Ontem').should('have.attr', 'aria-pressed', 'true')
    cy.get('[role=alert]').should('not.exist')

    cy.contains('button[aria-pressed]', 'Hoje').click()
    cy.get('input[placeholder="Buscar por produto…"]').type('Sal Refinado')
    cy.get('ul li button').first().click()
    cy.contains('Detalhes da Venda')
    cy.contains('Sal Refinado 1kg')
    cy.contains('button', 'Fechar').click()
    cy.contains('Detalhes da Venda').should('not.exist')

    cy.get('input[placeholder="Buscar por produto…"]').clear().type('Produto Que Não Existe De Verdade')
    cy.contains('Nenhuma venda encontrada')

    cy.get('input[placeholder="Buscar por produto…"]').clear()
    cy.get('ul li').its('length').should('be.gt', 0)
  })

  it('is reachable by an Operador (not admin-only)', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterClosed()

    cy.loginAs('Rafael', '2222')
    cy.ensureRegisterOpen()
    cy.visit('/sell')
    cy.get('a[aria-label="Histórico"]').should('exist')
    cy.visit('/history')
    cy.contains('h1', 'Histórico de Vendas')
    cy.get('[role=alert]').should('not.exist')
  })
})
