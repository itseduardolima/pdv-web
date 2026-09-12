import { parseTenantHost } from './tenant-host'

describe('parseTenantHost', () => {
  const base = 'app.localhost'

  it('extracts the slug from a direct subdomain of the base domain', () => {
    expect(parseTenantHost('demo.app.localhost', base)).toEqual({ host: 'demo.app.localhost', slug: 'demo' })
  })

  it('strips the port and lowercases the host', () => {
    expect(parseTenantHost('Demo.App.Localhost:3000', base)).toEqual({ host: 'demo.app.localhost', slug: 'demo' })
  })

  it('returns no slug for the bare base domain', () => {
    expect(parseTenantHost('app.localhost', base)).toEqual({ host: 'app.localhost', slug: null })
  })

  it('returns no slug for nested subdomains', () => {
    expect(parseTenantHost('a.b.app.localhost', base)).toEqual({ host: 'a.b.app.localhost', slug: null })
  })

  it('returns no slug for an unrelated host (custom domain candidate)', () => {
    expect(parseTenantHost('caixa.mercadinho.com.br', base)).toEqual({ host: 'caixa.mercadinho.com.br', slug: null })
  })

  it('returns no slug when the base domain is empty', () => {
    expect(parseTenantHost('demo.app.localhost', '')).toEqual({ host: 'demo.app.localhost', slug: null })
  })
})
