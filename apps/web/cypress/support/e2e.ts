// Comandos de apoio dos fluxos E2E: falam com a API real pelo rewrite /api
// (mesma origem, com o cookie de sessão do browser).

const tenantHost = () => new URL(Cypress.config('baseUrl') as string).host
const api = (path: string) => `${Cypress.config('baseUrl')}/api${path}`
const headers = () => ({ 'x-tenant-host': tenantHost(), 'content-type': 'application/json' })

Cypress.Commands.add('loginAs', (name: string, pin: string) => {
  cy.request({ url: api('/auth/operators'), headers: headers() }).then(({ body }) => {
    const operator = (body as { id: string; name: string }[]).find((item) => item.name === name)
    if (!operator) throw new Error(`Operador "${name}" não está no seed`)
    cy.request({ method: 'POST', url: api('/auth/login'), headers: headers(), body: { operatorId: operator.id, pin } })
  })
})

// Garante que não há caixa aberto (fecha o que existir) — deixa o fluxo determinístico.
Cypress.Commands.add('ensureRegisterClosed', () => {
  cy.request({ url: api('/cash-sessions/current'), headers: headers() }).then(({ body }) => {
    const session = (body as { session: { id: string } | null }).session
    if (session) cy.request({ method: 'POST', url: api(`/cash-sessions/${session.id}/close`), headers: headers() })
  })
})

// HU 4.7 (múltiplos caixas): o operador logado só passa da guarda de rota
// se ELE MESMO tiver um caixa aberto — /cash-sessions/current é o caixa de
// qualquer um do tenant, não serve pra decidir isso (um Administrador de
// teste anterior já pode ter aberto o dele, o que faria esta função achar
// "já tem caixa aberto" e nunca abrir o do operador atual).
Cypress.Commands.add('ensureRegisterOpen', () => {
  cy.request({ url: api('/cash-sessions/mine'), headers: headers() }).then(({ body }) => {
    const session = (body as { session: { id: string } | null }).session
    if (session) return

    cy.request({ url: api('/cash-sessions/registers'), headers: headers() }).then(({ body: registersBody }) => {
      const registers = (registersBody as { registers: { registerNumber: number; sessionId: string | null }[] })
        .registers
      const free = registers.find((register) => register.sessionId === null)
      cy.request({
        method: 'POST',
        url: api('/cash-sessions'),
        headers: headers(),
        body: { openingAmountCents: 10000, registerNumber: free?.registerNumber },
      })
    })
  })
})

// Fecha TODOS os registradores (não só o "current") como Administrador —
// único papel que fecha o caixa de qualquer um (03-regras-negocio § Caixa).
// Precisa disso, e não só ensureRegisterClosed, porque a loja demo tem 1
// caixa físico só: se outro operador ficou com o dele aberto, nem o Admin
// consegue abrir um novo pra si (nenhum registrador livre).
Cypress.Commands.add('ensureAllRegistersClosed', () => {
  cy.request({ url: api('/auth/operators'), headers: headers() }).then(({ body }) => {
    const admin = (body as { id: string; name: string }[]).find((item) => item.name === 'Administrador')
    if (!admin) return
    cy.request({
      method: 'POST',
      url: api('/auth/login'),
      headers: headers(),
      body: { operatorId: admin.id, pin: '1234' },
    })
    cy.request({ url: api('/cash-sessions/registers'), headers: headers() }).then(({ body: registersBody }) => {
      const registers = (registersBody as { registers: { sessionId: string | null }[] }).registers
      for (const register of registers) {
        if (register.sessionId)
          cy.request({ method: 'POST', url: api(`/cash-sessions/${register.sessionId}/close`), headers: headers() })
      }
    })
  })
})

// Higiene global: nenhum spec fechava o caixa que abria, então o próximo a
// rodar (ordem alfabética do Cypress) sempre herdava um caixa aberto de
// outro operador, travando `ensureRegisterOpen` do operador seguinte.
afterEach(() => {
  cy.ensureAllRegistersClosed()
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(name: string, pin: string): Chainable<void>
      ensureRegisterClosed(): Chainable<void>
      ensureRegisterOpen(): Chainable<void>
      ensureAllRegistersClosed(): Chainable<void>
    }
  }
}

export {}
