import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'
import { AuthRepository, type OperatorForLogin } from './auth.repository'
import { AuthService } from './auth.service'
import { LoginAttemptTracker } from './login-attempt.tracker'
import type { PinTokenService } from './pin-token.service'

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }))
const argon = argon2 as jest.Mocked<typeof argon2>

const operator: OperatorForLogin = {
  id: 'op1',
  name: 'Karol',
  role: 'ADMIN',
  photoUrl: null,
  pinHash: 'hash-op1',
  active: true,
  deletedAt: null,
}

async function makeService(overrides: Partial<Record<keyof AuthRepository, jest.Mock>> = {}) {
  const repository = {
    findActiveOperators: jest.fn().mockResolvedValue([]),
    findOperatorForLogin: jest.fn().mockResolvedValue(null),
    findSessionOperator: jest.fn().mockResolvedValue(null),
    findOperatorByEmail: jest.fn().mockResolvedValue(null),
    ...overrides,
  }
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as unknown as JwtService
  const tracker = new LoginAttemptTracker()
  const pinTokens = { sendPinLink: jest.fn().mockResolvedValue(undefined) }
  const service = new AuthService(
    repository as unknown as AuthRepository,
    tracker,
    jwt,
    pinTokens as unknown as PinTokenService,
  )
  argon.hash.mockResolvedValue('dummy-hash')
  await service.onModuleInit()
  return { service, repository, jwt, tracker, pinTokens }
}

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    argon.verify.mockImplementation(async (hash, pin) => hash === 'hash-op1' && pin === '1234')
  })
  afterEach(() => jest.useRealTimers())

  describe('listOperators', () => {
    it('delegates to the tenant-scoped repository query', async () => {
      const rows = [{ id: 'op1', name: 'Karol', photoUrl: null }]
      const { service, repository } = await makeService({ findActiveOperators: jest.fn().mockResolvedValue(rows) })
      await expect(service.listOperators('t1')).resolves.toEqual(rows)
      expect(repository.findActiveOperators).toHaveBeenCalledWith('t1')
    })
  })

  describe('login', () => {
    it('returns a signed token and the session on a correct PIN', async () => {
      const { service, jwt } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      const result = await service.login('t1', { operatorId: 'op1', pin: '1234' })
      expect(result.token).toBe('signed-token')
      expect(result.session).toEqual({
        operator: { id: 'op1', name: 'Karol', role: 'ADMIN', photoUrl: null },
        tenantId: 't1',
      })
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'op1', tenantId: 't1', role: 'ADMIN' })
    })

    it('never leaks pinHash in the result', async () => {
      const { service } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      const result = await service.login('t1', { operatorId: 'op1', pin: '1234' })
      expect(JSON.stringify(result)).not.toContain('hash-op1')
    })

    it.each([
      ['wrong PIN', operator, '9999'],
      ['inactive operator', { ...operator, active: false }, '1234'],
      ['deleted operator', { ...operator, deletedAt: new Date() }, '1234'],
      ['unknown operator', null, '1234'],
    ])('rejects %s with the same generic INVALID_CREDENTIALS error', async (_label, row, pin) => {
      const { service } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(row) })
      await expect(service.login('t1', { operatorId: 'op1', pin })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
        message: 'PIN incorreto.',
      })
    })

    it('still runs argon2.verify against a dummy hash when the operator does not exist', async () => {
      const { service } = await makeService()
      await service.login('t1', { operatorId: 'ghost', pin: '1234' }).catch(() => undefined)
      expect(argon.verify).toHaveBeenCalledWith('dummy-hash', '1234')
    })

    it('scopes the lookup to the tenant', async () => {
      const { service, repository } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      await service.login('t1', { operatorId: 'op1', pin: '1234' })
      expect(repository.findOperatorForLogin).toHaveBeenCalledWith('t1', 'op1')
    })

    it('blocks the sixth attempt within 60s with 429, even with the correct PIN', async () => {
      jest.useFakeTimers({ now: 0 })
      const { service, repository } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      for (let i = 0; i < 5; i += 1) {
        await service.login('t1', { operatorId: 'op1', pin: '0000' }).catch(() => undefined)
      }
      repository.findOperatorForLogin.mockClear()
      await expect(service.login('t1', { operatorId: 'op1', pin: '1234' })).rejects.toMatchObject({
        code: 'TOO_MANY_ATTEMPTS',
        statusCode: 429,
      })
      expect(repository.findOperatorForLogin).not.toHaveBeenCalled()
    })

    it('allows login again after the window expires', async () => {
      jest.useFakeTimers({ now: 0 })
      const { service } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      for (let i = 0; i < 5; i += 1) {
        await service.login('t1', { operatorId: 'op1', pin: '0000' }).catch(() => undefined)
      }
      jest.setSystemTime(60_000)
      await expect(service.login('t1', { operatorId: 'op1', pin: '1234' })).resolves.toBeDefined()
    })

    it('resets the failure counter after a successful login', async () => {
      const { service } = await makeService({ findOperatorForLogin: jest.fn().mockResolvedValue(operator) })
      for (let i = 0; i < 4; i += 1) {
        await service.login('t1', { operatorId: 'op1', pin: '0000' }).catch(() => undefined)
      }
      await service.login('t1', { operatorId: 'op1', pin: '1234' })
      for (let i = 0; i < 4; i += 1) {
        await service.login('t1', { operatorId: 'op1', pin: '0000' }).catch(() => undefined)
      }
      await expect(service.login('t1', { operatorId: 'op1', pin: '1234' })).resolves.toBeDefined()
    })
  })

  describe('me', () => {
    const session = { id: 'op1', tenantId: 't1', role: 'ADMIN' as const }

    it('returns the current session for an active operator', async () => {
      const { service, repository } = await makeService({
        findSessionOperator: jest.fn().mockResolvedValue({ id: 'op1', name: 'Karol', role: 'ADMIN', photoUrl: null }),
      })
      await expect(service.me(session)).resolves.toEqual({
        operator: { id: 'op1', name: 'Karol', role: 'ADMIN', photoUrl: null },
        tenantId: 't1',
      })
      expect(repository.findSessionOperator).toHaveBeenCalledWith('t1', 'op1')
    })

    it('rejects with 401 when the operator was deactivated or deleted after login', async () => {
      const { service } = await makeService()
      await expect(service.me(session)).rejects.toMatchObject({ code: 'INVALID_SESSION', statusCode: 401 })
    })
  })

  describe('first access pending (no PIN yet)', () => {
    it('refuses login with the generic error, like a wrong PIN', async () => {
      const { service, repository } = await makeService({
        findOperatorForLogin: jest.fn().mockResolvedValue({ ...operator, pinHash: null }),
      })
      await expect(service.login('t1', { operatorId: 'op1', pin: '1234' })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      })
      expect(repository.findOperatorForLogin).toHaveBeenCalledWith('t1', 'op1')
    })
  })

  describe('forgotPin', () => {
    const withEmail = { id: 'op1', name: 'Karol', email: 'k@x.com', pinHash: 'h', active: true, deletedAt: null }

    it('sends the link when an active operator has that e-mail', async () => {
      const { service, pinTokens } = await makeService({
        findOperatorByEmail: jest.fn().mockResolvedValue(withEmail),
      })
      await expect(service.forgotPin('t1', { email: 'k@x.com' })).resolves.toBeUndefined()
      expect(pinTokens.sendPinLink).toHaveBeenCalledWith('t1', withEmail)
    })

    it('resolves silently (never errors) for unknown, inactive or deleted e-mails', async () => {
      for (const row of [null, { ...withEmail, active: false }, { ...withEmail, deletedAt: new Date() }]) {
        const { service, pinTokens } = await makeService({ findOperatorByEmail: jest.fn().mockResolvedValue(row) })
        await expect(service.forgotPin('t1', { email: 'k@x.com' })).resolves.toBeUndefined()
        expect(pinTokens.sendPinLink).not.toHaveBeenCalled()
      }
    })
  })
})
