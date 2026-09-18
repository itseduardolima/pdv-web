// Abaixo de md a Sidebar (que tem o botão "Sair") nem existe — só a
// BottomNav. "Sair" tinha ficado de fora da folha "Mais opções", sem
// nenhum outro jeito de deslogar no mobile.
describe('Sair no mobile', () => {
  it('logs out via "Mais opções" on a mobile viewport', () => {
    cy.viewport('iphone-x')
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    cy.visit('/sell')
    cy.get('button[aria-label="Mais opções"]').click()
    cy.contains('button', 'Sair').click()
    cy.location('pathname').should('eq', '/login')
  })
})
