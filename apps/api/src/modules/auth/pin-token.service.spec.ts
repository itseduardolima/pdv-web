import { ConfigService } from '@nestjs/config'
import argon2 from 'argon2'
import type { MailService } from '../mail/mail.service'
import { AuthRepository, type PinTokenRow } from './auth.repository'
import { hashToken, PinTokenService } from './pin-token.service'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('argon-hash') }))

const operator = { id: 'op1', name: 'Maria', email: 'maria@x.com', pinHash: null, active: true, deletedAt: null }

function tokenRow(overrides: Partial<PinTokenRow> = {}): PinTokenRow {
  return {
    id: 'tk1',
    tenantId: 't1',
    operatorId: 'op1',
    tokenHash: 'h',
    purpose: 'RESET',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
    operator: { id: 'op1', name: 'Maria', active: true, deletedAt: null },
    ...overrides,
  }
}

function makeService(overrides: Partial<Record<keyof AuthRepository, jest.Mock>> = {}) {
  const repository = {
    createPinToken: jest.fn().mockResolvedValue({}),
    findTenantHost: jest.fn().mockResolvedValue('demo.app.localhost'),
    findPinToken: jest.fn().mockResolvedValue(null),
    consumePinToken: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  const mail = { send: jest.fn().mockResolvedValue(undefined) }
  const config = { get: (_k: string, fallback?: string) => fallback } as unknown as ConfigService
  const service = new PinTokenService(repository as unknown as AuthRepository, mail as unknown as MailService, config)
  return { service, repository, mail }
}

describe('PinTokenService', () => {
  describe('sendPinLink', () => {
    it('stores only the hash, expires first access in 72h and mails the raw token in the store link', async () => {
      const { service, repository, mail } = makeService()
      const before = Date.now()
      await service.sendPinLink('t1', operator)

      const stored = repository.createPinToken.mock.calls[0][1] as {
        tokenHash: string
        purpose: string
        expiresAt: Date
      }
      const text = (mail.send.mock.calls[0][0] as { to: string; text: string }).text
      const token = /token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? ''
      expect(token.length).toBeGreaterThan(30)
      expect(text).not.toContain(stored.tokenHash)
      expect(stored.tokenHash).toBe(hashToken(token))
      expect(stored.purpose).toBe('FIRST_ACCESS')
      expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(72 * 60 * 60 * 1000 - 1000)
      expect(text).toContain('https://demo.app.localhost/set-pin?token=')
    })

    it('is a 1h RESET when the operator already has a PIN', async () => {
      const { service, repository, mail } = makeService()
      await service.sendPinLink('t1', { ...operator, pinHash: 'set' })
      const stored = repository.createPinToken.mock.calls[0][1] as { purpose: string; expiresAt: Date }
      expect(stored.purpose).toBe('RESET')
      expect(stored.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(60 * 60 * 1000)
      expect((mail.send.mock.calls[0][0] as { subject: string }).subject).toBe('Redefinir o seu PIN')
    })

    it('refuses an operator without e-mail (NO_EMAIL)', async () => {
      const { service, repository } = makeService()
      await expect(service.sendPinLink('t1', { ...operator, email: null })).rejects.toMatchObject({ code: 'NO_EMAIL' })
      expect(repository.createPinToken).not.toHaveBeenCalled()
    })
  })

  describe('inspect / setPin', () => {
    it('looks the token up by hash and returns the operator name and purpose', async () => {
      const { service, repository } = makeService({ findPinToken: jest.fn().mockResolvedValue(tokenRow()) })
      await expect(service.inspect('t1', 'raw')).resolves.toEqual({ operatorName: 'Maria', purpose: 'RESET' })
      expect(repository.findPinToken).toHaveBeenCalledWith('t1', hashToken('raw'))
    })

    it('rejects unknown, used, expired, inactive or deleted tokens with INVALID_TOKEN', async () => {
      const cases = [
        null,
        tokenRow({ usedAt: new Date() }),
        tokenRow({ expiresAt: new Date(Date.now() - 1) }),
        tokenRow({ operator: { id: 'op1', name: 'Maria', active: false, deletedAt: null } }),
        tokenRow({ operator: { id: 'op1', name: 'Maria', active: true, deletedAt: new Date() } }),
      ]
      for (const row of cases) {
        const { service, repository } = makeService({ findPinToken: jest.fn().mockResolvedValue(row) })
        await expect(service.setPin('t1', 'raw', '1234')).rejects.toMatchObject({
          code: 'INVALID_TOKEN',
          statusCode: 400,
        })
        expect(repository.consumePinToken).not.toHaveBeenCalled()
      }
    })

    it('hashes the new PIN and burns the token in one go', async () => {
      const { service, repository } = makeService({ findPinToken: jest.fn().mockResolvedValue(tokenRow()) })
      await service.setPin('t1', 'raw', '4321')
      expect(argon2.hash).toHaveBeenCalledWith('4321')
      expect(repository.consumePinToken).toHaveBeenCalledWith('t1', 'tk1', 'op1', 'argon-hash')
    })
  })
})
