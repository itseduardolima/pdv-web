const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost() })

type Totals = { CASH: number; CARD: number; PIX: number }
type Sale = { subtotalCents: number; discountCents: number; totalCents: number; items: { discountCents: number }[] }

const currentTotals = () =>
  cy
    .request({ url: api('/cash-sessions/current'), headers: headers() })
    .then(({ body }) => (body as { session: { totals: Totals } }).session.totals)

const lastSaleToday = () =>
  cy.request({ url: api('/sales?period=today'), headers: headers() }).then(({ body }) => (body as Sale[])[0] as Sale)

const addRiceAndOpenPayment = () => {
  cy.visit('/sell')
  cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
}

describe('Vender com desconto', () => {
  beforeEach(() => {
    cy.loginAs('Administrador', '1234')
    cy.ensureStock('Arroz 5kg', 20)
    cy.ensureRegisterOpen()
  })

  it('applies a discount in R$, charges the net total and shows it on the confirmation', () => {
    currentTotals().then((before) => {
      addRiceAndOpenPayment()
      cy.get('[data-cy=discount-toggle]').click()
      cy.get('input[name=discount]').type('500')
      cy.get('[data-cy=cart-discount-value]').should('contain.text', '5,00')
      cy.contains('button', 'Ir para o pagamento').click()
      cy.contains('[role=radio]', 'Pix').click()
      cy.contains('button', 'Finalizar Venda').click()

      cy.location('pathname').should('eq', '/sell/confirmed')
      cy.get('[data-cy=confirmed-discount]').should('contain.text', '5,00')

      lastSaleToday().then((sale) => {
        expect(sale.discountCents).to.eq(500)
        expect(sale.totalCents).to.eq(sale.subtotalCents - 500)
        expect(sale.items.reduce((sum, item) => sum + item.discountCents, 0)).to.eq(500)
        currentTotals().then((after) => {
          expect(after.PIX - before.PIX).to.eq(sale.totalCents)
        })
      })
    })
  })

  it('applies a percentage discount and names it on the sale details', () => {
    addRiceAndOpenPayment()
    cy.get('[data-cy=discount-toggle]').click()
    cy.get('[data-cy=discount-field]').contains('button', '%').click()
    cy.get('input[name=discount]').type('10')
    cy.get('[data-cy=cart-discount-summary]').should('be.visible')
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('[role=radio]', 'Cartão').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.location('pathname').should('eq', '/sell/confirmed')
    cy.get('[data-cy=confirmed-discount]').should('contain.text', 'Desconto (10%)')

    lastSaleToday().then((sale) => {
      expect(sale.discountCents).to.eq(Math.round(sale.subtotalCents * 0.1))
    })

    cy.visit('/history')
    cy.get('[data-cy=discounted-filter]').click()
    cy.get('ul li').each(($li) => expect($li.find('[data-cy=sale-gross]')).to.have.length(1))
    cy.get('ul li [data-cy=sale-gross]').should('exist')
    cy.get('ul li button').first().click()
    cy.get('[data-cy=sale-discount]').should('contain.text', 'Desconto (10%)')
  })

  it('refuses a discount that is not below the subtotal and keeps the sale open', () => {
    addRiceAndOpenPayment()
    cy.get('[data-cy=discount-toggle]').click()
    cy.get('input[name=discount]').type('99999999')
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('[role=radio]', 'Pix').click()
    cy.contains('button', 'Finalizar Venda').click()

    cy.get('[data-cy=payment-dialog] [role=alert]').should(
      'contain.text',
      'O desconto deve ser menor que o total da venda.',
    )
    cy.location('pathname').should('eq', '/sell')

    cy.get('[data-cy=payment-dialog]').contains('button', 'Voltar').click()
    cy.get('input[name=discount]').clear().type('100')
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.location('pathname').should('eq', '/sell/confirmed')
  })

  it('splits the discounted total equally between payments', () => {
    addRiceAndOpenPayment()
    cy.get('[data-cy=discount-toggle]').click()
    cy.get('input[name=discount]').type('500')
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Dividir pagamento').click()
    cy.get('[aria-label="Dividir por 2"]').click()
    cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Pix').click()
    cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Cartão').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.location('pathname').should('eq', '/sell/confirmed')

    lastSaleToday().then((sale) => {
      expect(sale.totalCents).to.eq(sale.subtotalCents - 500)
    })
  })

  it('drops the discount from the reports when the sale is voided', () => {
    const discountTotal = () =>
      cy
        .request({ url: api('/reports/summary?period=today'), headers: headers() })
        .then(({ body }) => (body as { discounts: { totalCents: number } }).discounts.totalCents)

    discountTotal().then((before) => {
      cy.request({ url: api('/products'), headers: headers() }).then(({ body }) => {
        const rice = (body as { id: string; name: string }[]).find((product) => product.name === 'Arroz 5kg')!
        cy.request({
          method: 'POST',
          url: api('/sales'),
          headers: { ...headers(), 'content-type': 'application/json' },
          body: {
            uuid: crypto.randomUUID(),
            paymentMethod: 'PIX',
            discount: { type: 'AMOUNT', value: 700 },
            items: [{ productId: rice.id, quantity: 1 }],
          },
        }).then(({ body: sale }) => {
          discountTotal().should('eq', before + 700)
          cy.request({
            method: 'POST',
            url: api(`/sales/${(sale as { id: string }).id}/void`),
            headers: { ...headers(), 'content-type': 'application/json' },
            body: { reason: 'Teste de desconto' },
          })
          discountTotal().should('eq', before)
        })
      })
    })
  })

  it('keeps the cart clean until the discount is asked for, and removes it again', () => {
    addRiceAndOpenPayment()
    cy.get('input[name=discount]').should('not.exist')
    cy.get('[data-cy=discount-toggle]').click()
    cy.get('input[name=discount]').type('500')
    cy.get('[data-cy=cart-discount-summary]').should('be.visible')
    cy.get('[data-cy=discount-remove]').click()
    cy.get('input[name=discount]').should('not.exist')
    cy.get('[data-cy=cart-discount-summary]').should('not.exist')
    cy.get('[data-cy=discount-toggle]').should('be.visible')
  })
})
