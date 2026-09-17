import type { ConfigService } from '@nestjs/config'
import { assertProductionSecrets } from './assert-production-secrets'

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService
}

describe('assertProductionSecrets', () => {
  it('does nothing outside production, even with placeholder secrets', () => {
    const config = makeConfig({
      NODE_ENV: 'development',
      SESSION_SECRET: 'change-me-to-a-long-random-secret',
      PLATFORM_SESSION_SECRET: 'dev-only-platform-secret-change-in-prod',
    })
    expect(() => assertProductionSecrets(config)).not.toThrow()
  })

  it('passes in production when both secrets look real', () => {
    const config = makeConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'f3a1c9...64-hex-chars-long-enough',
      PLATFORM_SESSION_SECRET: 'b2e7d4...another-real-looking-secret',
    })
    expect(() => assertProductionSecrets(config)).not.toThrow()
  })

  it('throws in production when SESSION_SECRET is still the .env.example placeholder', () => {
    const config = makeConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'change-me-to-a-long-random-secret',
      PLATFORM_SESSION_SECRET: 'a-real-secret-value',
    })
    expect(() => assertProductionSecrets(config)).toThrow(/SESSION_SECRET/)
  })

  it('throws in production when PLATFORM_SESSION_SECRET is still the .env.example placeholder', () => {
    const config = makeConfig({
      NODE_ENV: 'production',
      SESSION_SECRET: 'a-real-secret-value',
      PLATFORM_SESSION_SECRET: 'change-me-to-a-different-long-random-secret',
    })
    expect(() => assertProductionSecrets(config)).toThrow(/PLATFORM_SESSION_SECRET/)
  })

  it('throws in production when a secret is missing entirely', () => {
    const config = makeConfig({ NODE_ENV: 'production', SESSION_SECRET: 'a-real-secret-value' })
    expect(() => assertProductionSecrets(config)).toThrow(/PLATFORM_SESSION_SECRET/)
  })
})
