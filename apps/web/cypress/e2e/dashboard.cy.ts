// Dashboard (HU 7.1–7.3): total do dia, por forma de pagamento, mais
// vendidos e gráfico da semana — só Administrador.
describe('Dashboard', () => {
  it('shows today totals, top products and the week chart, and refreshes after a sale', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/dashboard')
    cy.contains('h1', 'Dashboard')
    cy.contains('Vendido hoje')
    cy.contains('Dinheiro')
    cy.contains('Cartão')
    cy.contains('Pix')
    cy.get('[data-cy=week-day]').should('have.length', 7)

    // uma venda a mais aparece no total de hoje e nos mais vendidos
    cy.get('[data-cy=today-total]')
      .invoke('text')
      .then((before) => {
        cy.visit('/sell')
        cy.get('button[aria-label="Adicionar Sal Refinado 1kg"]').click()
        cy.contains('[role=radio]', 'Cartão').click()
        cy.contains('button', 'Finalizar Venda').click()
        cy.location('pathname').should('eq', '/sell/confirmed')
        cy.contains('button', 'Nova Venda').click()

        cy.visit('/dashboard')
        cy.get('[data-cy=today-total]').should('not.have.text', before)
        cy.contains('[data-cy=top-product]', 'Sal Refinado 1kg')
      })
  })

  it('is not reachable by an Operador', () => {
    // A loja demo tem 1 caixa físico só (registerCount: 1) — o teste
    // anterior deixou o caixa do Administrador aberto; só ele mesmo (ou
    // outro admin) pode fechar o caixa de outra pessoa (403
    // NOT_CASH_SESSION_OWNER pra um Operador comum).
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterClosed()

    cy.loginAs('Rafael', '2222')
    cy.ensureRegisterOpen()
    cy.visit('/dashboard')
    cy.contains('[role=alert]', 'Apenas um Administrador pode fazer isso.')
    cy.contains('nav a', 'Dashboard').should('not.exist')
  })
})
