// Pagamento misto: Pix (valor fixo) + Dinheiro (resto), sem campo de troco;
// o Fechamento soma cada parte na sua forma.
const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost() })

type Totals = { CASH: number; CARD: number; PIX: number }
const currentTotals = () =>
  cy
    .request({ url: api('/cash-sessions/current'), headers: headers() })
    .then(({ body }) => (body as { session: { totals: Totals } }).session.totals)

describe('Vender com pagamento misto', () => {
  it('splits a sale between Pix and Dinheiro and sums each part at closing', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    currentTotals().then((before) => {
      cy.visit('/sell')
      cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
      cy.contains('button', 'Dividir pagamento').click()

      cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Pix').click()
      cy.get('input[name=partialAmount]').type('1000')
      cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Dinheiro').click()
      cy.get('input[name=amountReceived]').should('not.exist')

      cy.contains('button', 'Finalizar Venda').click()
      cy.location('pathname').should('eq', '/sell/confirmed')
      cy.contains('Pago com Pix + Dinheiro')

      currentTotals().then((after) => {
        expect(after.PIX - before.PIX).to.eq(1000)
        expect(after.CASH - before.CASH).to.be.greaterThan(0)
        expect(after.CARD - before.CARD).to.eq(0)
      })
    })
  })

  it('accepts two cards in the same sale', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    currentTotals().then((before) => {
      cy.visit('/sell')
      cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
      cy.contains('button', 'Dividir pagamento').click()
      cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Cartão').click()
      cy.get('input[name=partialAmount]').type('1000')
      cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Cartão').click()
      cy.contains('button', 'Finalizar Venda').click()
      cy.location('pathname').should('eq', '/sell/confirmed')
      cy.contains('Pago com Cartão')
      cy.contains('Cartão + Cartão').should('not.exist')

      currentTotals().then((after) => {
        expect(after.CARD - before.CARD).to.be.greaterThan(1000)
        expect(after.PIX - before.PIX).to.eq(0)
        expect(after.CASH - before.CASH).to.eq(0)
      })
    })
  })
})
