// Gestão de operadores pela tela (HU 6.1–6.7): criar, inativar, resetar
// PIN, regra do último admin e excluir. Mensagens vêm da API.
describe('Operadores: criar, ativar/inativar, PIN e excluir', () => {
  const name = `E2E Maria ${Date.now()}`

  beforeEach(() => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
  })

  it('manages an operator end to end', () => {
    cy.visit('/operators/new')
    cy.contains('h1', 'Novo Operador')

    // submit vazio: erros de campo da API
    cy.contains('button', 'Salvar Operador').click()
    cy.contains('O nome precisa ter pelo menos 2 caracteres')
    // sem e-mail, o PIN inicial é obrigatório (03-regras-negocio § Autenticação)
    cy.contains('Informe um PIN inicial ou um e-mail para o primeiro acesso')

    cy.get('input[name=name]').type(name)
    // só dígitos, no máximo 4
    cy.get('input[name=pin]').type('8a8')
    cy.get('input[name=pin]').should('have.value', '88')
    cy.get('input[name=pin]').type('88')
    cy.get('input[name=pin]').should('have.value', '8888')
    cy.contains('button', 'Salvar Operador').click()
    cy.contains('Salvo')
    cy.location('pathname').should('eq', '/operators')

    // inativar pelo toggle: some da tela de Login
    cy.contains('[data-cy=operator-card]', name).as('card')
    cy.get('@card').find('[role=switch]').should('have.attr', 'aria-checked', 'true').click()
    cy.get('@card').find('[role=switch]').should('have.attr', 'aria-checked', 'false')
    cy.get('@card').should('contain', 'inativo')

    // ninguém inativa a própria conta (e o último admin nunca cai) — a API recusa e a tela mostra
    cy.contains('[data-cy=operator-card]', 'Administrador').find('[role=switch]').click()
    cy.contains('[role=alert]', 'própria conta')
    cy.contains('[data-cy=operator-card]', 'Administrador')
      .find('[role=switch]')
      .should('have.attr', 'aria-checked', 'true')

    // resetar PIN
    cy.get('@card').find('a[aria-label^="Editar"]').click()
    cy.contains('h1', 'Editar Operador')
    cy.contains('button', 'Salvar PIN').click()
    cy.contains('O PIN deve ter exatamente 4 dígitos')
    cy.get('input[name=newPin]').type('4444')
    cy.contains('button', 'Salvar PIN').click()
    cy.contains('PIN salvo')

    // excluir
    cy.contains('button', 'Excluir Operador').click()
    cy.get('[role=dialog]').contains('button', 'Excluir').click()
    cy.location('pathname').should('eq', '/operators')
    cy.contains('[data-cy=operator-card]', name).should('not.exist')
  })

  it('creates an operator by e-mail (first access pending) and resends the link', () => {
    const email = `e2e-${Date.now()}@exemplo.com`
    cy.visit('/operators/new')
    cy.get('input[name=name]').type('E2E Por E-mail')
    cy.get('input[name=email]').type(email)
    // com e-mail, o PIN deixa de ser obrigatório
    cy.contains('button', 'Salvar Operador').click()
    cy.location('pathname').should('eq', '/operators')
    cy.contains('[data-cy=operator-card]', 'E2E Por E-mail').as('card')
    cy.get('@card').find('[data-cy=pending-first-access]').should('contain', 'Primeiro acesso pendente')

    // enquanto não define o PIN, não aparece no Login
    cy.request({ url: '/api/auth/operators', headers: { 'x-tenant-host': 'demo.app.localhost' } })
      .its('body')
      .should((body) => {
        expect((body as { name: string }[]).map((o) => o.name)).not.to.include('E2E Por E-mail')
      })

    cy.get('@card').find('a[aria-label^="Editar"]').click()
    cy.contains('h2', 'Primeiro acesso')
    cy.contains('button', 'Reenviar link').click()
    cy.contains('Enviado')
    // sem e-mail não há reset manual na tela
    cy.contains('button', 'Salvar PIN').should('not.exist')

    cy.contains('button', 'Excluir Operador').click()
    cy.get('[role=dialog]').contains('button', 'Excluir').click()
    cy.location('pathname').should('eq', '/operators')
  })

  it('an Administrador must have an e-mail', () => {
    cy.visit('/operators/new')
    cy.get('input[name=name]').type('E2E Chefe')
    cy.contains('label', 'Papel').click()
    cy.contains('[role=option]', 'Administrador').click()
    cy.get('input[name=pin]').type('1111')
    cy.contains('button', 'Salvar Operador').click()
    cy.contains('Administrador precisa de e-mail para recuperar o PIN')
  })
})
