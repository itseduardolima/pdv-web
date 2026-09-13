// Configurações da Loja (HU 11.1-11.4): editar nome, logo, cores e fuso —
// só Administrador.
const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost() })

describe('Configurações da Loja', () => {
  afterEach(() => {
    // Deixa o tenant como o seed espera, pros outros specs não quebrarem.
    cy.loginAs('Administrador', '1234')
    cy.visit('/settings')
    cy.get('input[name=name]').clear().type('Mercadinho Demo')
    cy.get('input[name=primaryColor]').clear().type('#e6e51e')
    cy.get('input[name=accentColor]').clear().type('#466cf3')
    cy.contains('label', 'Fuso horário').click()
    cy.contains('[role=option]', 'São Paulo').click()
    cy.contains('button', 'Salvar').click()
    cy.contains('button', 'Salvo')
  })

  it('edits the store name', () => {
    cy.loginAs('Administrador', '1234')
    cy.visit('/settings')
    cy.contains('h1', 'Configurações')

    cy.get('input[name=name]').clear().type('Mercadinho da Maria')
    cy.contains('button', 'Salvar').click()
    cy.contains('button', 'Salvo')

    cy.request({ url: api('/tenant/current'), headers: headers() })
      .its('body.name')
      .should('eq', 'Mercadinho da Maria')
  })

  it('edits the primary/accent colors and the timezone', () => {
    cy.loginAs('Administrador', '1234')
    cy.visit('/settings')

    cy.get('input[name=primaryColor]').clear().type('#112233')
    cy.get('input[name=accentColor]').clear().type('#445566')
    cy.contains('label', 'Fuso horário').click()
    cy.contains('[role=option]', 'Manaus').click()
    cy.contains('button', 'Salvar').click()
    cy.contains('button', 'Salvo')

    cy.request({ url: api('/tenant/current'), headers: headers() }).then(({ body }) => {
      expect(body.primaryColor).to.eq('#112233')
      expect(body.accentColor).to.eq('#445566')
      expect(body.timezone).to.eq('America/Manaus')
      // Cor escura → tinta clara, recalculada pelo backend (11.3).
      expect(body.primaryInkColor).to.eq('#ffffff')
    })
  })

  it('is not reachable by an Operador', () => {
    cy.loginAs('Rafael', '2222')
    cy.visit('/settings')
    cy.contains('nav a', 'Configurações').should('not.exist')

    cy.get('input[name=name]').clear().type('Hack')
    cy.contains('button', 'Salvar').click()
    cy.contains('[role=alert]', 'Apenas um Administrador pode fazer isso.')
  })
})
