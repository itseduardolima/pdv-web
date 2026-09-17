import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'
import type { PlatformAdmin } from '@prisma/client'
import { PlatformAdminRepository } from './platform-admin.repository'
import { PlatformAuthService } from './platform-auth.service'

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }))
const argon = argon2 as jest.Mocked<typeof argon2>

const admin: PlatformAdmin = {
  id: 'pa1',
  email: 'dono@example.com',
  name: 'Dono',
  passwordHash: 'hash-pa1',
  createdAt: new Date('2026-01-01'),
}

async function makeService(overrides: Partial<Record<keyof PlatformAdminRepository, jest.Mock>> = {}) {
  const repository = {
    findByEmail: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    ...overrides,
  }
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-platform-token') } as unknown as JwtService
  const service = new PlatformAuthService(repository as unknown as PlatformAdminRepository, jwt)
  argon.hash.mockResolvedValue('dummy-hash')
  await service.onModuleInit()
  return { service, repository, jwt }
}

describe('PlatformAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    argon.verify.mockImplementation(async (hash, password) => hash === 'hash-pa1' && password === 'senha-correta')
  })

  describe('login', () => {
    it('returns a signed token (sem tenantId no payload) and the admin on a correct password', async () => {
      const { service, jwt } = await makeService({ findByEmail: jest.fn().mockResolvedValue(admin) })
      const result = await service.login({ email: 'dono@example.com', password: 'senha-correta' })
      expect(result.token).toBe('signed-platform-token')
      expect(result.admin).toEqual({
        id: 'pa1',
        email: 'dono@example.com',
        name: 'Dono',
        createdAt: '2026-01-01T00:00:00.000Z',
      })
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'pa1' })
    })

    it('never leaks passwordHash in the result', async () => {
      const { service } = await makeService({ findByEmail: jest.fn().mockResolvedValue(admin) })
      const result = await service.login({ email: 'dono@example.com', password: 'senha-correta' })
      expect(JSON.stringify(result)).not.toContain('hash-pa1')
    })

    it.each([
      ['wrong password', admin, 'senha-errada'],
      ['unknown e-mail', null, 'senha-correta'],
    ])('rejects %s with the same generic INVALID_CREDENTIALS error', async (_label, row, password) => {
      const { service } = await makeService({ findByEmail: jest.fn().mockResolvedValue(row) })
      await expect(service.login({ email: 'dono@example.com', password })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      })
    })

    it('still runs argon2.verify against a dummy hash when the e-mail does not exist', async () => {
      const { service } = await makeService()
      await service.login({ email: 'fantasma@example.com', password: 'senha-correta' }).catch(() => undefined)
      expect(argon.verify).toHaveBeenCalledWith('dummy-hash', 'senha-correta')
    })
  })

  describe('me', () => {
    it('returns the admin for a valid session', async () => {
      const { service, repository } = await makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await expect(service.me({ id: 'pa1' })).resolves.toEqual({
        id: 'pa1',
        email: 'dono@example.com',
        name: 'Dono',
        createdAt: '2026-01-01T00:00:00.000Z',
      })
      expect(repository.findById).toHaveBeenCalledWith('pa1')
    })

    it('rejects with 401 INVALID_SESSION when the admin no longer exists', async () => {
      const { service } = await makeService()
      await expect(service.me({ id: 'ghost' })).rejects.toMatchObject({ code: 'INVALID_SESSION', statusCode: 401 })
    })
  })
})
