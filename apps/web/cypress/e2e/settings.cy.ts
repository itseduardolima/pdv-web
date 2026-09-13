// Configurações da Loja (HU 11.1-11.5): editar nome, logo, cor primária e
// fuso, com prévia ao vivo — só Administrador.
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

  it('edits the primary color and the timezone, and previews the color live', () => {
    cy.loginAs('Administrador', '1234')
    cy.visit('/settings')

    cy.get('input[name=primaryColor]').clear().type('#112233')
    cy.contains('Botão de exemplo').should('have.css', 'background-color', 'rgb(17, 34, 51)')

    // Lista de cores prontas: clique define a cor, sem digitar hex.
    cy.get('[aria-label="Usar cor #fda4af"]').click()
    cy.get('input[name=primaryColor]').should('have.value', '#fda4af')
    cy.get('[aria-label="Usar cor #fda4af"]').should('have.attr', 'aria-pressed', 'true')
    cy.contains('Botão de exemplo').should('have.css', 'background-color', 'rgb(253, 164, 175)')

    // Seletor de arrastar (matiz/saturação-brilho): navegação por teclado
    // já move o valor — arrastar de verdade é coberto no component test.
    cy.get('[aria-label="Matiz da cor"]')
      .focus()
      .invoke('attr', 'aria-valuenow')
      .then((before) => {
        cy.get('[aria-label="Matiz da cor"]').type('{rightarrow}{rightarrow}')
        cy.get('[aria-label="Matiz da cor"]').should('not.have.attr', 'aria-valuenow', before)
      })
    cy.get('input[name=primaryColor]').should('not.have.value', '#fda4af')

    cy.get('input[name=primaryColor]').clear().type('#112233')
    cy.contains('label', 'Fuso horário').click()
    cy.contains('[role=option]', 'Manaus').click()
    cy.contains('button', 'Salvar').click()
    cy.contains('button', 'Salvo')

    cy.request({ url: api('/tenant/current'), headers: headers() }).then(({ body }) => {
      expect(body.primaryColor).to.eq('#112233')
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
