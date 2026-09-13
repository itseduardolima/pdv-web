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
  createdAt: new Date('2026-01-01'),
}

function makeService(overrides: Partial<Record<keyof TenantRepository, jest.Mock>> = {}) {
  const repository = {
    findByDomain: jest.fn().mockResolvedValue(null),
    findBySlug: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
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
      await expect(service.resolveByHost('caixa.demo.com.br')).resolves.toEqual({ id: 'tenant_1' })
      expect(repository.findBySlug).not.toHaveBeenCalled()
    })

    it('resolves by slug when the host is a subdomain of the base domain', async () => {
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await expect(service.resolveByHost('demo.app.localhost')).resolves.toEqual({ id: 'tenant_1' })
      expect(repository.findByDomain).toHaveBeenCalledWith('demo.app.localhost')
      expect(repository.findBySlug).toHaveBeenCalledWith('demo')
    })

    it('normalizes port and case before looking up', async () => {
      const { service, repository } = makeService({ findBySlug: jest.fn().mockResolvedValue(tenant) })
      await expect(service.resolveByHost('DEMO.app.localhost:3000')).resolves.toEqual({ id: 'tenant_1' })
      expect(repository.findByDomain).toHaveBeenCalledWith('demo.app.localhost')
      expect(repository.findBySlug).toHaveBeenCalledWith('demo')
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
  })
})
