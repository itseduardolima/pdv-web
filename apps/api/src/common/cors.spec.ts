import { corsOriginMatcher } from './cors'

function allows(list: string, origin: string | undefined): boolean {
  let allowed: boolean | undefined
  corsOriginMatcher(list)(origin, (_error, allow) => {
    allowed = allow
  })
  return allowed === true
}

describe('corsOriginMatcher', () => {
  const list = 'https://app.pdv.com.br,https://*.app.pdv.com.br'

  it('allows exact origins and one-label tenant subdomains', () => {
    expect(allows(list, 'https://app.pdv.com.br')).toBe(true)
    expect(allows(list, 'https://karol.app.pdv.com.br')).toBe(true)
  })

  it('rejects other hosts, nested subdomains, other schemes and lookalikes', () => {
    expect(allows(list, 'https://evil.com')).toBe(false)
    expect(allows(list, 'https://a.b.app.pdv.com.br')).toBe(false)
    expect(allows(list, 'http://karol.app.pdv.com.br')).toBe(false)
    expect(allows(list, 'https://karol.app.pdv.com.br.evil.com')).toBe(false)
    expect(allows(list, 'https://xapp.pdv.com.br')).toBe(false)
  })

  it('allows requests without an Origin header (not cross-site)', () => {
    expect(allows(list, undefined)).toBe(true)
  })
})
