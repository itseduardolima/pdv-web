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
    update: jest.fn(),
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

  describe('updateProfile', () => {
    it('updates name and email when the email is free', async () => {
      const updated = { ...admin, name: 'Novo Nome', email: 'novo@example.com' }
      const { service, repository } = await makeService({
        findById: jest.fn().mockResolvedValue(admin),
        update: jest.fn().mockResolvedValue(updated),
      })
      const result = await service.updateProfile({ id: 'pa1' }, { name: 'Novo Nome', email: 'novo@example.com' })
      expect(repository.update).toHaveBeenCalledWith('pa1', { name: 'Novo Nome', email: 'novo@example.com' })
      expect(result).toEqual({
        id: 'pa1',
        email: 'novo@example.com',
        name: 'Novo Nome',
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    })

    it('does not check email uniqueness when the email is unchanged', async () => {
      const { service, repository } = await makeService({
        findById: jest.fn().mockResolvedValue(admin),
        update: jest.fn().mockResolvedValue(admin),
      })
      await service.updateProfile({ id: 'pa1' }, { name: 'Dono', email: admin.email })
      expect(repository.findByEmail).not.toHaveBeenCalled()
    })

    it('rejects an email already used by another admin with 409 EMAIL_IN_USE', async () => {
      const otherAdmin = { ...admin, id: 'pa2' }
      const { service, repository } = await makeService({
        findById: jest.fn().mockResolvedValue(admin),
        findByEmail: jest.fn().mockResolvedValue(otherAdmin),
      })
      await expect(
        service.updateProfile({ id: 'pa1' }, { name: 'Dono', email: 'outro@example.com' }),
      ).rejects.toMatchObject({ code: 'EMAIL_IN_USE', statusCode: 409 })
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('rejects with 401 INVALID_SESSION when the admin no longer exists', async () => {
      const { service } = await makeService()
      await expect(
        service.updateProfile({ id: 'ghost' }, { name: 'Dono', email: 'dono@example.com' }),
      ).rejects.toMatchObject({ code: 'INVALID_SESSION', statusCode: 401 })
    })
  })

  describe('changePassword', () => {
    it('changes the password when the current password matches', async () => {
      const { service, repository } = await makeService({
        findById: jest.fn().mockResolvedValue(admin),
        update: jest.fn().mockResolvedValue(admin),
      })
      argon.hash.mockResolvedValue('new-hash')
      await service.changePassword({ id: 'pa1' }, { currentPassword: 'senha-correta', newPassword: 'senha-nova-123' })
      expect(argon.verify).toHaveBeenCalledWith('hash-pa1', 'senha-correta')
      expect(argon.hash).toHaveBeenCalledWith('senha-nova-123')
      expect(repository.update).toHaveBeenCalledWith('pa1', { passwordHash: 'new-hash' })
    })

    it('rejects the wrong current password with 401 INVALID_CURRENT_PASSWORD', async () => {
      const { service, repository } = await makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await expect(
        service.changePassword({ id: 'pa1' }, { currentPassword: 'senha-errada', newPassword: 'senha-nova-123' }),
      ).rejects.toMatchObject({ code: 'INVALID_CURRENT_PASSWORD', statusCode: 401 })
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('rejects with 401 INVALID_SESSION when the admin no longer exists', async () => {
      const { service } = await makeService()
      await expect(
        service.changePassword({ id: 'ghost' }, { currentPassword: 'senha-correta', newPassword: 'senha-nova-123' }),
      ).rejects.toMatchObject({ code: 'INVALID_SESSION', statusCode: 401 })
    })
  })
})
