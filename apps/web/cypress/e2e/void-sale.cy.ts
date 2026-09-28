// Anular venda (03-regras-negocio § Venda): só Administrador, só em caixa
// aberto, devolve o estoque e tira a venda dos totais.
const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost(), 'content-type': 'application/json' })

type Totals = { CASH: number; CARD: number; PIX: number }
type Product = { id: string; name: string; stockQuantity: number }

const totals = () =>
  cy
    .request({ url: api('/cash-sessions/current'), headers: headers() })
    .then(({ body }) => (body as { session: { totals: Totals } }).session.totals)

const riceStock = () =>
  cy
    .request({ url: api('/products'), headers: headers() })
    .then(({ body }) => (body as Product[]).find((product) => product.name === 'Arroz 5kg')!)

const sellRice = () =>
  riceStock().then((rice) =>
    cy
      .request({
        method: 'POST',
        url: api('/sales'),
        headers: headers(),
        body: { uuid: crypto.randomUUID(), paymentMethod: 'PIX', items: [{ productId: rice.id, quantity: 1 }] },
      })
      .then(({ body }) => body as { id: string }),
  )

describe('Anular venda', () => {
  beforeEach(() => {
    cy.loginAs('Administrador', '1234')
    cy.ensureStock('Arroz 5kg', 20)
  })

  it('voids from the history screen: asks for a reason, returns stock, leaves the totals', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    riceStock().then((before) => {
      totals().then((totalsBefore) => {
        sellRice()
        cy.visit('/history')
        cy.get('ul li button').first().click()

        cy.contains('button', 'Anular venda').click()
        cy.contains('button', 'Confirmar anulação').click()
        cy.contains('Informe o motivo da anulação')

        cy.get('input[name=voidReason]').type('ab')
        cy.contains('button', 'Confirmar anulação').click()
        cy.contains('Descreva o motivo em pelo menos 5 caracteres')
        cy.get('input[name=voidReason]').clear().type('Cliente desistiu')
        cy.contains('button', 'Confirmar anulação').click()
        cy.get('[data-cy=sale-voided]').should('contain', 'Cliente desistiu')
        cy.contains('button', 'Anular venda').should('not.exist')

        riceStock().its('stockQuantity').should('eq', before.stockQuantity)
        totals().should('deep.equal', totalsBefore)
      })
    })
  })

  it('refuses an operator and refuses voiding twice', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    sellRice().then((sale) => {
      cy.loginAs('Rafael', '2222')
      cy.request({
        method: 'POST',
        url: api(`/sales/${sale.id}/void`),
        headers: headers(),
        body: { reason: 'motivo qualquer' },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403)

      cy.loginAs('Administrador', '1234')
      const voidIt = () =>
        cy.request({
          method: 'POST',
          url: api(`/sales/${sale.id}/void`),
          headers: headers(),
          body: { reason: 'erro de digitação' },
          failOnStatusCode: false,
        })
      voidIt().its('status').should('eq', 200)
      voidIt().its('body.code').should('eq', 'ALREADY_VOIDED')
    })
  })

  it('always refuses a sale whose register is already closed', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    sellRice().then((sale) => {
      cy.ensureRegisterClosed()
      cy.request({
        method: 'POST',
        url: api(`/sales/${sale.id}/void`),
        headers: headers(),
        body: { reason: 'tarde demais' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(409)
        expect(response.body.code).to.eq('CASH_SESSION_CLOSED')
      })
    })
  })

  it('keeps a long reason without spaces inside the details dialog', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    sellRice().then((sale) => {
      cy.request({
        method: 'POST',
        url: api(`/sales/${sale.id}/void`),
        headers: headers(),
        body: { reason: 'a'.repeat(200) },
      })
      cy.visit('/history')
      cy.get('ul li button').first().click()
      cy.get('[data-cy=sale-voided]').then(($banner) => {
        const banner = $banner[0]!.getBoundingClientRect()
        const dialog = $banner.closest('[role=dialog]')[0]!.getBoundingClientRect()
        expect(banner.right).to.be.at.most(dialog.right)
        expect($banner[0]!.scrollWidth).to.be.at.most($banner[0]!.clientWidth)
      })
    })
  })
})
