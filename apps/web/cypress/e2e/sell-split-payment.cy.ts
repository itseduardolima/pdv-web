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
  beforeEach(() => {
    cy.loginAs('Administrador', '1234')
    cy.ensureStock('Arroz 5kg', 20)
  })

  it('splits a sale between Pix and Dinheiro and sums each part at closing', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    currentTotals().then((before) => {
      cy.visit('/sell')
      cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
      cy.contains('button', 'Ir para o pagamento').click()
      cy.contains('button', 'Dividir pagamento').click()

      cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Pix').click()
      cy.get('input[name=partAmount-0]').type('1000')
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
      cy.contains('button', 'Ir para o pagamento').click()
      cy.contains('button', 'Dividir pagamento').click()
      cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Cartão').click()
      cy.get('input[name=partAmount-0]').type('1000')
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

  it('splits a sale equally between 3 people, paying with 3 methods', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    currentTotals().then((before) => {
      cy.visit('/sell')
      cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
      cy.contains('button', 'Ir para o pagamento').click()
      cy.contains('button', 'Dividir pagamento').click()
      cy.get('[aria-label="Dividir por 3"]').click()
      cy.get('[aria-label="Dividir por 3"]').should('have.attr', 'aria-pressed', 'true')
      cy.get('[aria-label="Dividir por 2"]').should('have.attr', 'aria-pressed', 'false')

      cy.get('[data-cy=split-part]').should('have.length', 2)
      cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Pix').click()
      cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Cartão').click()
      cy.get('[aria-label="3º pagamento"]').contains('[role=radio]', 'Dinheiro').click()
      cy.contains('button', 'Finalizar Venda').click()

      cy.location('pathname').should('eq', '/sell/confirmed')
      cy.contains('Pago com Pix + Cartão + Dinheiro')

      currentTotals().then((after) => {
        const pix = after.PIX - before.PIX
        const card = after.CARD - before.CARD
        const cash = after.CASH - before.CASH
        expect(pix).to.be.greaterThan(0)
        expect(card).to.eq(pix)
        // A última parte absorve os centavos que sobram (no máximo 2).
        expect(cash - pix).to.be.within(0, 2)
      })
    })
  })

  it('accepts 3 parts added by hand and refuses when they cover the whole total', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/sell')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Dividir pagamento').click()
    cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Pix').click()
    cy.get('input[name=partAmount-0]').type('999999')
    cy.contains('button', '+ Adicionar forma').click()
    cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Cartão').click()
    cy.get('input[name=partAmount-1]').type('100')
    cy.get('[aria-label="3º pagamento"]').contains('[role=radio]', 'Dinheiro').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.contains('A soma dos valores informados deve ser menor que o total da venda.')
    cy.location('pathname').should('eq', '/sell')
  })

  it('keeps Finalizar Venda reachable with 5 payments (the payment modal scrolls inside)', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/sell')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Dividir pagamento').click()
    cy.get('[aria-label="Dividir por 5"]').click()
    cy.get('[data-cy=split-part]').should('have.length', 4)
    cy.contains('button', 'Finalizar Venda').then(($button) => {
      const rect = $button[0].getBoundingClientRect()
      expect(rect.top).to.be.greaterThan(0)
      expect(rect.bottom).to.be.at.most(Cypress.config('viewportHeight'))
    })
    // O último pagamento (o resto) alcança-se rolando o próprio carrinho.
    cy.contains('h3', '5º pagamento · o resto').scrollIntoView().should('be.visible')
    cy.contains('button', 'Finalizar Venda').then(($button) => {
      expect($button[0].getBoundingClientRect().bottom).to.be.at.most(Cypress.config('viewportHeight'))
    })
  })

  it('flags every payment that still has no method, not only the last one', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/sell')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Dividir pagamento').click()
    cy.get('[aria-label="Dividir por 4"]').click()
    cy.get('[data-cy=split-part]').should('have.length', 3)
    // escolhe só a 2ª parte; 1ª, 3ª e o resto continuam sem forma
    cy.get('[aria-label="2º pagamento"]').contains('[role=radio]', 'Pix').click()
    cy.contains('button', 'Finalizar Venda').click()

    cy.get('[data-cy=payment-dialog] [role=alert]').should('have.length', 3)
    cy.get('[aria-label="1º pagamento"]')
      .parent()
      .find('[role=alert]')
      .should('contain', 'Escolha a forma de pagamento')
    cy.get('[aria-label="2º pagamento"]').parent().find('[role=alert]').should('not.exist')
    cy.get('[aria-label="3º pagamento"]')
      .parent()
      .find('[role=alert]')
      .should('contain', 'Escolha a forma de pagamento')
    cy.get('[aria-label="4º pagamento"]')
      .parent()
      .find('[role=alert]')
      .should('contain', 'Escolha a forma de pagamento')

    // escolher a forma some com o aviso daquela parte
    cy.get('[aria-label="1º pagamento"]').contains('[role=radio]', 'Cartão').click()
    cy.get('[aria-label="1º pagamento"]').parent().find('[role=alert]').should('not.exist')
    cy.location('pathname').should('eq', '/sell')
  })

  it('scrolls the tall payment modal to the stock error on its own', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    cy.visit('/sell')
    // Feijão 1kg tem 30 no seed; 31 cliques excedem
    for (let i = 0; i < 31; i += 1) cy.get('button[aria-label="Adicionar Feijão 1kg"]').click()
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('button', 'Dividir pagamento').click()
    cy.get('[aria-label="Dividir por 5"]').click()
    for (const part of ['1º', '2º', '3º', '4º']) {
      cy.get(`[aria-label="${part} pagamento"]`).contains('[role=radio]', 'Pix').click()
    }
    cy.get('[aria-label="5º pagamento"]').contains('[role=radio]', 'Dinheiro').click()
    // rola o miolo para o topo: o erro vai nascer bem abaixo
    cy.get('[data-cy=payment-dialog] div.overflow-y-auto').scrollTo('top')
    cy.contains('button', 'Finalizar Venda').click()

    cy.get('[data-cy=payment-dialog] [role=alert]')
      .contains('Estoque insuficiente')
      .should(($alert) => {
        const body = $alert.closest('div.overflow-y-auto')[0]!.getBoundingClientRect()
        const rect = $alert[0]!.getBoundingClientRect()
        expect(rect.top).to.be.at.least(body.top)
        expect(rect.bottom).to.be.at.most(body.bottom)
      })
  })
})
