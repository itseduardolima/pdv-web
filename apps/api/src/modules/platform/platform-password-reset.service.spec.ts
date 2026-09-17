import { ConfigService } from '@nestjs/config'
import argon2 from 'argon2'
import type { MailService } from '../mail/mail.service'
import { hashToken } from '../auth/pin-token.service'
import { PlatformAdminRepository, type ResetTokenRow } from './platform-admin.repository'
import { PlatformPasswordResetService } from './platform-password-reset.service'

jest.mock('argon2', () => ({ hash: jest.fn().mockResolvedValue('argon-hash') }))

const admin = { id: 'pa1', name: 'Dono', email: 'dono@example.com' }

function tokenRow(overrides: Partial<ResetTokenRow> = {}): ResetTokenRow {
  return {
    id: 'rt1',
    platformAdminId: 'pa1',
    tokenHash: 'h',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    createdAt: new Date(),
    platformAdmin: admin,
    ...overrides,
  }
}

function makeService(overrides: Partial<Record<keyof PlatformAdminRepository, jest.Mock>> = {}) {
  const repository = {
    createResetToken: jest.fn().mockResolvedValue({}),
    findResetToken: jest.fn().mockResolvedValue(null),
    consumeResetToken: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  const mail = { send: jest.fn().mockResolvedValue(undefined) }
  const config = { get: (_k: string, fallback?: string) => fallback } as unknown as ConfigService
  const service = new PlatformPasswordResetService(
    repository as unknown as PlatformAdminRepository,
    mail as unknown as MailService,
    config,
  )
  return { service, repository, mail }
}

describe('PlatformPasswordResetService', () => {
  describe('sendResetLink', () => {
    it('stores only the hash, expires in 1h and mails the raw token in the reset-password link', async () => {
      const { service, repository, mail } = makeService()
      const before = Date.now()
      await service.sendResetLink(admin)

      const stored = repository.createResetToken.mock.calls[0][0] as { tokenHash: string; expiresAt: Date }
      const text = (mail.send.mock.calls[0][0] as { to: string; text: string }).text
      const token = /token=([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? ''
      expect(token.length).toBeGreaterThan(30)
      expect(text).not.toContain(stored.tokenHash)
      expect(stored.tokenHash).toBe(hashToken(token))
      expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000)
      expect(text).toContain('/platform/reset-password?token=')
      expect((mail.send.mock.calls[0][0] as { to: string }).to).toBe('dono@example.com')
    })
  })

  describe('inspect / resetPassword', () => {
    it('looks the token up by hash and returns the admin name', async () => {
      const { service, repository } = makeService({ findResetToken: jest.fn().mockResolvedValue(tokenRow()) })
      await expect(service.inspect('raw')).resolves.toEqual({ adminName: 'Dono' })
      expect(repository.findResetToken).toHaveBeenCalledWith(hashToken('raw'))
    })

    it('rejects unknown, used or expired tokens with INVALID_TOKEN', async () => {
      const cases = [null, tokenRow({ usedAt: new Date() }), tokenRow({ expiresAt: new Date(Date.now() - 1) })]
      for (const row of cases) {
        const { service, repository } = makeService({ findResetToken: jest.fn().mockResolvedValue(row) })
        await expect(service.resetPassword('raw', 'senha-nova-123')).rejects.toMatchObject({
          code: 'INVALID_TOKEN',
          statusCode: 400,
        })
        expect(repository.consumeResetToken).not.toHaveBeenCalled()
      }
    })

    it('hashes the new password and burns the token in one go', async () => {
      const { service, repository } = makeService({ findResetToken: jest.fn().mockResolvedValue(tokenRow()) })
      await service.resetPassword('raw', 'senha-nova-123')
      expect(argon2.hash).toHaveBeenCalledWith('senha-nova-123')
      expect(repository.consumeResetToken).toHaveBeenCalledWith('rt1', 'pa1', 'argon-hash')
    })
  })
})
