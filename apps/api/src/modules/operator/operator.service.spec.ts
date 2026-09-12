import argon2 from 'argon2'
import type { OperatorSession } from '../../common/types/request'
import { OperatorRepository, type OperatorRow } from './operator.repository'
import { OperatorService } from './operator.service'

const admin: OperatorRow = {
  id: 'o1',
  tenantId: 't1',
  name: 'Administrador',
  role: 'ADMIN',
  active: true,
  photoUrl: null,
  createdAt: new Date('2026-01-01'),
  deletedAt: null,
}
const clerk: OperatorRow = { ...admin, id: 'o2', name: 'Carlos', role: 'OPERATOR' }
const actor: OperatorSession = { id: 'o1', tenantId: 't1', role: 'ADMIN' }
const otherAdminActor: OperatorSession = { id: 'o9', tenantId: 't1', role: 'ADMIN' }

function makeService(overrides: Partial<Record<keyof OperatorRepository, jest.Mock>> = {}) {
  const repository = {
    findMany: jest.fn().mockResolvedValue([admin, clerk]),
    findById: jest.fn().mockResolvedValue(null),
    countActiveAdmins: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockImplementation(async (_t: string, data: Record<string, unknown>) => ({ ...admin, ...data })),
    update: jest
      .fn()
      .mockImplementation(async (_t: string, _id: string, data: Record<string, unknown>) => ({ ...admin, ...data })),
    setPin: jest.fn().mockResolvedValue(admin),
    setActive: jest.fn().mockImplementation(async (_t: string, _id: string, active: boolean) => ({ ...admin, active })),
    softDelete: jest.fn().mockResolvedValue({ ...clerk, deletedAt: new Date(), active: false }),
    ...overrides,
  }
  return { service: new OperatorService(repository as unknown as OperatorRepository), repository }
}

describe('OperatorService', () => {
  it('lists operators without tenant/deletedAt/pinHash and with createdAt as ISO string', async () => {
    const { service } = makeService()
    const result = await service.list('t1')
    expect(result).toHaveLength(2)
    expect(result[0]).not.toHaveProperty('tenantId')
    expect(result[0]).not.toHaveProperty('pinHash')
    expect(result[0]).not.toHaveProperty('deletedAt')
    expect(result[0]?.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('throws OPERATOR_NOT_FOUND for an unknown or other-tenant id', async () => {
    const { service } = makeService()
    await expect(service.get('t1', 'nope')).rejects.toMatchObject({ code: 'OPERATOR_NOT_FOUND', statusCode: 404 })
    await expect(service.setPin('t1', 'nope', '1234')).rejects.toMatchObject({ code: 'OPERATOR_NOT_FOUND' })
  })

  describe('create', () => {
    it('hashes the PIN with argon2 and never stores it in clear text', async () => {
      const { service, repository } = makeService()
      await service.create('t1', { name: 'Maria', role: 'OPERATOR', pin: '4321' })
      const data = repository.create.mock.calls[0][1] as { pinHash: string; photoUrl: string | null }
      expect(data.pinHash).not.toBe('4321')
      expect(data).not.toHaveProperty('pin')
      expect(data.photoUrl).toBeNull()
      await expect(argon2.verify(data.pinHash, '4321')).resolves.toBe(true)
    })
  })

  describe('setPin', () => {
    it('stores a new argon2 hash for the operator', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(clerk) })
      await service.setPin('t1', 'o2', '9999')
      const hash = repository.setPin.mock.calls[0][2] as string
      await expect(argon2.verify(hash, '9999')).resolves.toBe(true)
    })
  })

  describe('last active admin rule (LAST_ADMIN)', () => {
    it('refuses to deactivate the last active admin', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await expect(service.setActive('t1', 'o1', false, otherAdminActor)).rejects.toMatchObject({
        code: 'LAST_ADMIN',
        statusCode: 409,
      })
      expect(repository.setActive).not.toHaveBeenCalled()
    })

    it('refuses to demote the last active admin to OPERATOR', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await expect(service.update('t1', 'o1', { role: 'OPERATOR' }, otherAdminActor)).rejects.toMatchObject({
        code: 'LAST_ADMIN',
      })
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('refuses to delete the last active admin', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await expect(service.remove('t1', 'o1', otherAdminActor)).rejects.toMatchObject({ code: 'LAST_ADMIN' })
      expect(repository.softDelete).not.toHaveBeenCalled()
    })

    it('allows the same actions when another active admin exists', async () => {
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue(admin),
        countActiveAdmins: jest.fn().mockResolvedValue(2),
      })
      await expect(service.setActive('t1', 'o1', false, otherAdminActor)).resolves.toMatchObject({ active: false })
      await expect(service.update('t1', 'o1', { role: 'OPERATOR' }, otherAdminActor)).resolves.toMatchObject({
        role: 'OPERATOR',
      })
      await service.remove('t1', 'o1', otherAdminActor)
      expect(repository.softDelete).toHaveBeenCalledWith('t1', 'o1')
    })

    it('does not count an OPERATOR against the rule', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(clerk) })
      await service.setActive('t1', 'o2', false, actor)
      await service.remove('t1', 'o2', actor)
      expect(repository.countActiveAdmins).not.toHaveBeenCalled()
      expect(repository.softDelete).toHaveBeenCalledWith('t1', 'o2')
    })

    it('renaming an admin or re-activating never triggers the rule', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(admin) })
      await service.update('t1', 'o1', { name: 'Admin 2' }, actor)
      await service.setActive('t1', 'o1', true, actor)
      expect(repository.countActiveAdmins).not.toHaveBeenCalled()
    })
  })

  describe('self change (SELF_CHANGE)', () => {
    it('an operator cannot deactivate, demote or delete their own account', async () => {
      const { service } = makeService({
        findById: jest.fn().mockResolvedValue(admin),
        countActiveAdmins: jest.fn().mockResolvedValue(5),
      })
      await expect(service.setActive('t1', 'o1', false, actor)).rejects.toMatchObject({ code: 'SELF_CHANGE' })
      await expect(service.update('t1', 'o1', { role: 'OPERATOR' }, actor)).rejects.toMatchObject({
        code: 'SELF_CHANGE',
      })
      await expect(service.remove('t1', 'o1', actor)).rejects.toMatchObject({ code: 'SELF_CHANGE', statusCode: 409 })
    })
  })
})
