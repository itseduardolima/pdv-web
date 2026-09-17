import { httpUrlSchema } from './common'

describe('httpUrlSchema', () => {
  const schema = httpUrlSchema()

  it.each(['https://cdn.example.com/a.png', 'http://localhost:9000/a.png'])(
    'accepts a valid http(s) URL: %s',
    (value) => {
      expect(schema.safeParse(value).success).toBe(true)
    },
  )

  it.each(['HTTP://cdn.example.com/a.png', 'Https://cdn.example.com/a.png', 'HTTPS://cdn.example.com/a.png'])(
    'accepts an http(s) scheme regardless of case: %s',
    (value) => {
      expect(schema.safeParse(value).success).toBe(true)
    },
  )

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com/a.png',
    'not a url at all',
  ])('rejects a non-http(s) or invalid value: %s', (value) => {
    expect(schema.safeParse(value).success).toBe(false)
  })
})
