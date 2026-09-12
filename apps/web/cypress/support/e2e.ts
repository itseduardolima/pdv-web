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

Cypress.Commands.add('ensureRegisterOpen', () => {
  cy.request({ url: api('/cash-sessions/current'), headers: headers() }).then(({ body }) => {
    const session = (body as { session: { id: string } | null }).session
    if (!session)
      cy.request({
        method: 'POST',
        url: api('/cash-sessions'),
        headers: headers(),
        body: { openingAmountCents: 10000 },
      })
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(name: string, pin: string): Chainable<void>
      ensureRegisterClosed(): Chainable<void>
      ensureRegisterOpen(): Chainable<void>
    }
  }
}

export {}
