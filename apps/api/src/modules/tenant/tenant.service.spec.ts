import { ConfigService } from '@nestjs/config'
import type { Tenant } from '@prisma/client'
import { NotFoundError } from '../../common/errors/domain.error'
import { TenantRepository } from './tenant.repository'
import { TenantService } from './tenant.service'

const tenant: Tenant = {
  id: 'tenant_1',
  slug: 'demo',
  domain: 'caixa.demo.com.br',
  name: 'Mercadinho Demo',
  logoUrl: null,
  primaryColor: '#e6e51e',
  primaryInkColor: null,
  timezone: 'America/Sao_Paulo',
  accentColor: '#466cf3',
  registerCount: 1,
  createdAt: new Date('2026-01-01'),
  active: true,
}

function makeService(overrides: Partial<Record<keyof TenantRepository, jest.Mock>> = {}) {
  const repository = {
    findByDomain: jest.fn().mockResolvedValue(null),
    findBySlug: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    updateIfNoRegisterAbove: jest.fn(),
    ...overrides,
  }
  const config = { get: jest.fn((_key: string, fallback: unknown) => fallback) } as unknown as ConfigService
  const service = new TenantService(repository as unknown as TenantRepository, config)
  return { service, repository }
}

describe('TenantService', () => {
  afterEach(() => jest.useRealTimers())

  describe('resolveByHost', () => {
    it('resolves by custom domain first', async () => {
      const { service, repository } = makeService({ findByDomain: jest.fn().mockResolvedValue(tenant) })
      await expect(service.resolveByHost('caixa.demo.com.br')).resolves.toEqual({ id: 'tenant_1', active: true })
      expect(repository.findBySlug).not.toHaveBeenCalled()
    })

    it('resolves by slug when the host is a subdomain of the base domain', async () => {
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await expect(service.resolveByHost('demo.app.localhost')).resolves.toEqual({ id: 'tenant_1', active: true })
      expect(repository.findByDomain).toHaveBeenCalledWith('demo.app.localhost')
      expect(repository.findBySlug).toHaveBeenCalledWith('demo')
    })

    it('normalizes port and case before looking up', async () => {
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await expect(service.resolveByHost('DEMO.app.localhost:3000')).resolves.toEqual({ id: 'tenant_1', active: true })
      expect(repository.findByDomain).toHaveBeenCalledWith('demo.app.localhost')
      expect(repository.findBySlug).toHaveBeenCalledWith('demo')
    })

    it('carries active=false through so a suspended tenant is blocked (HU 13.7)', async () => {
      const { service } = makeService({ findBySlug: jest.fn().mockResolvedValue({ ...tenant, active: false }) })
      await expect(service.resolveByHost('demo.app.localhost')).resolves.toEqual({ id: 'tenant_1', active: false })
    })

    it('returns null for an unknown host and does not try a slug outside the base domain', async () => {
      const { service, repository } = makeService()
      await expect(service.resolveByHost('outra.loja.com')).resolves.toBeNull()
      expect(repository.findBySlug).not.toHaveBeenCalled()
    })

    it('serves the second lookup from cache within the TTL', async () => {
      jest.useFakeTimers({ now: 0 })
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await service.resolveByHost('demo.app.localhost')
      await service.resolveByHost('demo.app.localhost')
      expect(repository.findByDomain).toHaveBeenCalledTimes(1)
      expect(repository.findBySlug).toHaveBeenCalledTimes(1)
    })

    it('hits the repository again after the TTL expires', async () => {
      jest.useFakeTimers({ now: 0 })
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await service.resolveByHost('demo.app.localhost')
      jest.setSystemTime(60_001)
      await service.resolveByHost('demo.app.localhost')
      expect(repository.findBySlug).toHaveBeenCalledTimes(2)
    })

    it('caches unknown hosts too, so a bad host does not hammer the database', async () => {
      jest.useFakeTimers({ now: 0 })
      const { service, repository } = makeService()
      await service.resolveByHost('outra.loja.com')
      await service.resolveByHost('outra.loja.com')
      expect(repository.findByDomain).toHaveBeenCalledTimes(1)
    })
  })

  describe('getCurrent', () => {
    it('returns the public tenant and computes primaryInkColor when it is null', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(tenant) })
      await expect(service.getCurrent('tenant_1')).resolves.toEqual({
        id: 'tenant_1',
        slug: 'demo',
        name: 'Mercadinho Demo',
        logoUrl: null,
        primaryColor: '#e6e51e',
        primaryInkColor: '#000000',
        registerCount: 1,
        accentColor: '#466cf3',
        timezone: 'America/Sao_Paulo',
      })
    })

    it('keeps primaryInkColor when the tenant defines it', async () => {
      const { service } = makeService({
        findById: jest.fn().mockResolvedValue({ ...tenant, primaryInkColor: '#123456' }),
      })
      const result = await service.getCurrent('tenant_1')
      expect(result.primaryInkColor).toBe('#123456')
    })

    it('throws TENANT_NOT_FOUND when the id does not exist', async () => {
      const { service } = makeService()
      await expect(service.getCurrent('missing')).rejects.toMatchObject(
        expect.objectContaining({ code: 'TENANT_NOT_FOUND', statusCode: 404 }),
      )
      await expect(service.getCurrent('missing')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('updateCurrent', () => {
    const input = {
      name: 'Novo Nome',
      logoUrl: null,
      primaryColor: '#e6e51e',
      accentColor: '#466cf3',
      timezone: 'America/Sao_Paulo',
      registerCount: 1,
    }

    it('updates the tenant and resets primaryInkColor so it is recomputed from the new color', async () => {
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue(tenant),
        update: jest.fn().mockResolvedValue({ ...tenant, ...input, primaryInkColor: null }),
      })
      const result = await service.updateCurrent('tenant_1', input)
      expect(repository.update).toHaveBeenCalledWith('tenant_1', { ...input, primaryInkColor: null })
      expect(result.name).toBe('Novo Nome')
      expect(result.primaryInkColor).toBe('#000000')
    })

    it('throws TENANT_NOT_FOUND when the id does not exist', async () => {
      const { service, repository } = makeService()
      await expect(service.updateCurrent('missing', input)).rejects.toMatchObject(
        expect.objectContaining({ code: 'TENANT_NOT_FOUND', statusCode: 404 }),
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('allows reducing registerCount when no open session uses a register above the new count', async () => {
      const updated = { ...tenant, ...input, registerCount: 2, primaryInkColor: null }
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue({ ...tenant, registerCount: 3 }),
        updateIfNoRegisterAbove: jest.fn().mockResolvedValue({ tenant: updated, conflictRegister: null }),
      })
      await expect(service.updateCurrent('tenant_1', { ...input, registerCount: 2 })).resolves.toMatchObject({
        registerCount: 2,
      })
      expect(repository.updateIfNoRegisterAbove).toHaveBeenCalledWith(
        'tenant_1',
        { ...input, registerCount: 2, primaryInkColor: null },
        2,
      )
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('rejects reducing registerCount below an open session with 409 REGISTER_IN_USE (HU 11.6)', async () => {
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue({ ...tenant, registerCount: 3 }),
        updateIfNoRegisterAbove: jest.fn().mockResolvedValue({ tenant, conflictRegister: 3 }),
      })
      await expect(service.updateCurrent('tenant_1', { ...input, registerCount: 2 })).rejects.toMatchObject({
        code: 'REGISTER_IN_USE',
        statusCode: 409,
        details: { registerNumber: 3 },
      })
      expect(repository.update).not.toHaveBeenCalled()
    })

    it('checks and writes registerCount together, closing the window for a concurrent register open', async () => {
      // A checagem (maior registerNumber aberto) e a gravação acontecem na
      // MESMA transação do repositório — o Service só orquestra o resultado.
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue({ ...tenant, registerCount: 2 }),
        updateIfNoRegisterAbove: jest
          .fn()
          .mockResolvedValue({ tenant: { ...tenant, registerCount: 1 }, conflictRegister: null }),
      })
      await service.updateCurrent('tenant_1', { ...input, registerCount: 1 })
      expect(repository.updateIfNoRegisterAbove).toHaveBeenCalledTimes(1)
    })
  })
})
