import type { Tenant } from '@prisma/client'
import { provisionTenant } from '../tenant/tenant-provisioning'
import { PlatformTenantService } from './platform-tenant.service'

jest.mock('../tenant/tenant-provisioning', () => ({ provisionTenant: jest.fn() }))
const provisionTenantMock = provisionTenant as jest.Mock

const tenant: Tenant = {
  id: 't_new',
  slug: 'mercadinho-da-maria',
  domain: null,
  name: 'Mercadinho da Maria',
  logoUrl: null,
  primaryColor: '#e6e51e',
  primaryInkColor: null,
  accentColor: '#466cf3',
  timezone: 'America/Sao_Paulo',
  registerCount: 1,
  createdAt: new Date('2026-01-01'),
  active: true,
}

const validInput = {
  name: 'Mercadinho da Maria',
  slug: 'mercadinho-da-maria',
  adminName: 'Maria',
  adminPin: '1234',
}

function makeService(
  overrides: {
    findUnique?: jest.Mock
    findMany?: jest.Mock
    count?: jest.Mock
    findFirst?: jest.Mock
    update?: jest.Mock
  } = {},
) {
  const prisma = {
    tenant: {
      findUnique: overrides.findUnique ?? jest.fn().mockResolvedValue(null),
      findMany: overrides.findMany ?? jest.fn().mockResolvedValue([]),
      update: overrides.update ?? jest.fn(),
    },
    operator: {
      count: overrides.count ?? jest.fn().mockResolvedValue(0),
      findFirst: overrides.findFirst ?? jest.fn().mockResolvedValue(null),
    },
  }
  const tenantService = { clearHostCache: jest.fn() }
  const service = new PlatformTenantService(prisma as never, tenantService as never)
  return { service, prisma, tenantService }
}

describe('PlatformTenantService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('create', () => {
    it('creates a tenant via provisionTenant and returns it with the active operator count', async () => {
      provisionTenantMock.mockResolvedValue({ tenant, createdAdminPin: '1234' })
      const { service, prisma } = makeService({ count: jest.fn().mockResolvedValue(1) })
      const result = await service.create(validInput)
      expect(result).toEqual({
        id: 't_new',
        slug: 'mercadinho-da-maria',
        name: 'Mercadinho da Maria',
        domain: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        activeOperatorCount: 1,
        active: true,
      })
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { slug: 'mercadinho-da-maria' } })
      expect(provisionTenantMock).toHaveBeenCalledWith(
        prisma,
        { slug: 'mercadinho-da-maria', name: 'Mercadinho da Maria', primaryColor: undefined },
        { name: 'Maria', email: null, pin: '1234' },
      )
    })

    it.each(['admin', 'api', 'www', 'platform'])('rejects the reserved slug "%s" with 400 VALIDATION', async (slug) => {
      const { service, prisma } = makeService()
      await expect(service.create({ ...validInput, slug })).rejects.toMatchObject({
        code: 'VALIDATION',
        statusCode: 400,
        details: { fieldErrors: { slug: expect.any(Array) } },
      })
      expect(prisma.tenant.findUnique).not.toHaveBeenCalled()
      expect(provisionTenantMock).not.toHaveBeenCalled()
    })

    it('rejects a slug already in use with 409 SLUG_IN_USE', async () => {
      const { service } = makeService({ findUnique: jest.fn().mockResolvedValue(tenant) })
      await expect(service.create(validInput)).rejects.toMatchObject({ code: 'SLUG_IN_USE', statusCode: 409 })
      expect(provisionTenantMock).not.toHaveBeenCalled()
    })

    it('rejects an adminEmail already used by another loja with 400 VALIDATION', async () => {
      const otherTenant = { ...tenant, id: 't_other' }
      const { service } = makeService({
        findMany: jest.fn().mockResolvedValue([otherTenant]),
        findFirst: jest.fn().mockResolvedValue({ id: 'op_1' }),
      })
      await expect(service.create({ ...validInput, adminEmail: 'maria@example.com' })).rejects.toMatchObject({
        code: 'VALIDATION',
        statusCode: 400,
        details: { fieldErrors: { adminEmail: expect.any(Array) } },
      })
      expect(provisionTenantMock).not.toHaveBeenCalled()
    })

    it('allows creating when adminEmail is not used by any other loja', async () => {
      provisionTenantMock.mockResolvedValue({ tenant, createdAdminPin: '1234' })
      const { service } = makeService({
        findMany: jest.fn().mockResolvedValue([{ id: 't_other' }]),
        findFirst: jest.fn().mockResolvedValue(null),
      })
      await expect(service.create({ ...validInput, adminEmail: 'maria@example.com' })).resolves.toMatchObject({
        id: 't_new',
      })
    })
  })

  describe('list', () => {
    it('lists tenants with their active operator count, one per tenant (RLS exige o tenant declarado)', async () => {
      const count = jest.fn().mockResolvedValue(3)
      const { service } = makeService({ findMany: jest.fn().mockResolvedValue([tenant]), count })
      const result = await service.list({ page: 1, pageSize: 10 })
      expect(result).toEqual({
        items: [
          {
            id: 't_new',
            slug: 'mercadinho-da-maria',
            name: 'Mercadinho da Maria',
            domain: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            activeOperatorCount: 3,
            active: true,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalOperators: 3,
        newLast30Days: 0,
      })
      expect(count).toHaveBeenCalledWith({ where: { tenantId: 't_new', active: true, deletedAt: null } })
    })

    it('filters by q and paginates over the full matching set', async () => {
      const tenantB = { ...tenant, id: 't_new_2', slug: 'mercadinho-b', name: 'Mercadinho B' }
      const findMany = jest.fn().mockResolvedValue([tenant, tenantB])
      const count = jest.fn().mockResolvedValue(1)
      const { service, prisma } = makeService({ findMany, count })

      const result = await service.list({ page: 2, pageSize: 1, q: 'mercadinho' })

      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'mercadinho', mode: 'insensitive' } },
            { slug: { contains: 'mercadinho', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(result.items).toEqual([expect.objectContaining({ id: 't_new_2' })])
      expect(result.total).toBe(2)
      expect(result.totalOperators).toBe(2)
    })
  })

  describe('setActive', () => {
    it('suspends a tenant and clears the TenantService host cache (HU 13.7)', async () => {
      const suspended = { ...tenant, active: false }
      const { service, prisma, tenantService } = makeService({
        findUnique: jest.fn().mockResolvedValue(tenant),
        update: jest.fn().mockResolvedValue(suspended),
        count: jest.fn().mockResolvedValue(1),
      })
      const result = await service.setActive('t_new', false)
      expect(prisma.tenant.update).toHaveBeenCalledWith({ where: { id: 't_new' }, data: { active: false } })
      expect(tenantService.clearHostCache).toHaveBeenCalledTimes(1)
      expect(result.active).toBe(false)
    })

    it('reactivates a tenant', async () => {
      const { service } = makeService({
        findUnique: jest.fn().mockResolvedValue({ ...tenant, active: false }),
        update: jest.fn().mockResolvedValue(tenant),
        count: jest.fn().mockResolvedValue(1),
      })
      const result = await service.setActive('t_new', true)
      expect(result.active).toBe(true)
    })

    it('throws TENANT_NOT_FOUND when the id does not exist', async () => {
      const { service, prisma } = makeService({ findUnique: jest.fn().mockResolvedValue(null) })
      await expect(service.setActive('missing', false)).rejects.toMatchObject({
        code: 'TENANT_NOT_FOUND',
        statusCode: 404,
      })
      expect(prisma.tenant.update).not.toHaveBeenCalled()
    })
  })
})
