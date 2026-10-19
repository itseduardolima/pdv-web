// HU 8.2: uma venda feita com a API fora do ar entra na fila local (Dexie)
// e a tela já responde como concluída; ao voltar a ter rede (aqui: remonta
// o app, que sincroniza ao montar), a venda chega ao servidor sem duplicar.
const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost() })

describe('Vender sem rede: fila e sincronização', () => {
  it('queues the sale while the API is unreachable, then syncs it once back online', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    // Um único intercept por rota, com uma "chave" mutável que o teste vira
    // — evita o intercept antigo (forceNetworkError) "vazar" pra depois que
    // um novo cy.intercept() sem stub é só um espião e cai pro anterior.
    let networkDown = true
    cy.intercept('POST', '**/sales', (req) => {
      if (networkDown) req.destroy()
      else req.continue()
    }).as('createSale')
    cy.intercept('POST', '**/sales/sync', (req) => {
      if (networkDown) req.destroy()
      else req.continue()
    }).as('syncSales')

    cy.request({ url: api('/cash-sessions/current'), headers: headers() }).then(({ body }) => {
      const cashSessionId = (body as { session: { id: string } }).session.id

      cy.request({ url: api(`/cash-sessions/${cashSessionId}/sales`), headers: headers() }).then((before) => {
        const countBefore = (before.body as unknown[]).length

        cy.visit('/sell')
        cy.get('button[aria-label="Adicionar Sal Refinado 1kg"]').click()
        cy.contains('button', 'Ir para o pagamento').click()
        cy.contains('[role=radio]', 'Pix').click()

        cy.contains('button', 'Finalizar Venda').click()
        cy.wait('@createSale')
        cy.wait('@syncSales') // o checkout já tenta sincronizar na hora; também bloqueado

        // UI responde como concluída mesmo sem ter chegado ao servidor ainda.
        cy.location('pathname').should('eq', '/sell/confirmed')
        cy.contains('Venda finalizada!')
        cy.contains('Pago com Pix')

        // A venda não existe no servidor enquanto está só na fila local.
        cy.request({ url: api(`/cash-sessions/${cashSessionId}/sales`), headers: headers() })
          .its('body')
          .should('have.length', countBefore)

        // Rede "volta": remonta o app, que sincroniza a fila ao montar (AppShell).
        cy.then(() => {
          networkDown = false
        })
        cy.visit('/sell')
        cy.wait('@syncSales').its('response.statusCode').should('eq', 200)

        cy.request({ url: api(`/cash-sessions/${cashSessionId}/sales`), headers: headers() })
          .its('body')
          .then((sales) => {
            expect(sales).to.have.length(countBefore + 1)
            expect((sales as { paymentMethod: string }[])[0]).to.include({ paymentMethod: 'PIX' })
          })
      })
    })
  })
})

describe('Vender sem rede com desconto', () => {
  it('keeps the discount in the queue and the server applies it on sync', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()

    let networkDown = true
    cy.intercept('POST', '**/sales', (req) => {
      if (networkDown) req.destroy()
      else req.continue()
    }).as('createSale')
    cy.intercept('POST', '**/sales/sync', (req) => {
      if (networkDown) req.destroy()
      else req.continue()
    }).as('syncSales')

    cy.visit('/sell')
    cy.get('button[aria-label="Adicionar Sal Refinado 1kg"]').click()
    cy.get('[data-cy=discount-toggle]').click()
    cy.get('input[name=discount]').type('10')
    cy.contains('button', 'Ir para o pagamento').click()
    cy.contains('[role=radio]', 'Pix').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.wait('@createSale')
    cy.wait('@syncSales')

    cy.location('pathname').should('eq', '/sell/confirmed')
    cy.get('[data-cy=confirmed-discount]').should('contain.text', '0,10')

    cy.then(() => {
      networkDown = false
    })
    cy.visit('/sell')
    cy.wait('@syncSales').its('response.statusCode').should('eq', 200)

    cy.request({ url: api('/sales?period=today'), headers: headers() })
      .its('body')
      .then((sales) => {
        const last = (sales as { discountCents: number; totalCents: number; subtotalCents: number }[])[0]!
        expect(last.discountCents).to.eq(10)
        expect(last.totalCents).to.eq(last.subtotalCents - 10)
      })
  })
})
