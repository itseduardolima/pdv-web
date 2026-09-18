// "Esqueci meu PIN" e "Definir PIN" pelo link (03-regras-negocio § Autenticação).
// O e-mail em dev vai para o log da API, então aqui cobrimos a tela de
// pedido (resposta sempre genérica) e o link inválido; o caminho feliz do
// token é coberto no Jest da API.
describe('Recuperação de PIN', () => {
  beforeEach(() => cy.clearCookies())

  it('asks for the e-mail and always shows the same confirmation', () => {
    cy.visit('/login')
    cy.contains('button', 'Administrador').click()
    cy.contains('a', 'Esqueci meu PIN').click()
    cy.location('pathname').should('eq', '/forgot-pin')

    cy.contains('button', 'Enviar link').click()
    cy.contains('Informe um e-mail válido')

    cy.get('input[name=email]').type('ninguem@exemplo.com')
    cy.contains('button', 'Enviar link').click()
    cy.get('[data-cy=forgot-sent]').should('contain', 'chega em instantes')
  })

  it('rejects an invalid link and offers to request a new one', () => {
    cy.visit('/set-pin?token=nao-existe')
    cy.contains('[role=alert]', 'Este link não é válido ou já expirou')
    cy.contains('a', 'Pedir um novo link').should('have.attr', 'href', '/forgot-pin')
    cy.visit('/set-pin')
    cy.contains('[role=alert]', 'Este link não é válido ou já expirou')
  })
})
