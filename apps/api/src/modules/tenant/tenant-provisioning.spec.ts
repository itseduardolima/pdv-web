import argon2 from 'argon2'
import { provisionTenant } from './tenant-provisioning'

jest.mock('argon2', () => ({ hash: jest.fn() }))
const argon = argon2 as jest.Mocked<typeof argon2>

function makePrisma(overrides: { existingAdmin?: unknown } = {}) {
  const executeRaw = jest.fn()
  const findFirst = jest.fn().mockResolvedValue(overrides.existingAdmin ?? null)
  const create = jest.fn()
  const tx = { $executeRaw: executeRaw, operator: { findFirst, create } }
  const prisma = {
    tenant: { upsert: jest.fn().mockResolvedValue({ id: 't1', slug: 'nova-loja', name: 'Nova Loja' }) },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
  }
  return { prisma, tx, executeRaw, findFirst, create }
}

describe('provisionTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    argon.hash.mockResolvedValue('hashed-pin')
  })

  it('upserts the tenant by slug', async () => {
    const { prisma } = makePrisma()
    await provisionTenant(prisma as never, { slug: 'nova-loja', name: 'Nova Loja' }, { name: 'Admin', pin: '1234' })
    expect(prisma.tenant.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'nova-loja' } }))
  })

  it('sets app.tenant_id before creating the admin (RLS obrigatório na mesma transação)', async () => {
    const { prisma, executeRaw, create } = makePrisma()
    await provisionTenant(prisma as never, { slug: 'nova-loja', name: 'Nova Loja' }, { name: 'Admin', pin: '1234' })
    expect(executeRaw).toHaveBeenCalled()
    expect(create).toHaveBeenCalled()
    // set_config roda antes do insert do operador, na mesma transação.
    const executeOrder = executeRaw.mock.invocationCallOrder[0]
    const createOrder = create.mock.invocationCallOrder[0]
    expect(executeOrder).toBeLessThan(createOrder as number)
  })

  it('creates the admin with the given pin hashed, and returns it in plain text', async () => {
    const { prisma, create } = makePrisma()
    const result = await provisionTenant(
      prisma as never,
      { slug: 'nova-loja', name: 'Nova Loja' },
      { name: 'Admin', email: 'admin@nova-loja.com', pin: '9876' },
    )
    expect(argon.hash).toHaveBeenCalledWith('9876')
    expect(create).toHaveBeenCalledWith({
      data: { tenantId: 't1', name: 'Admin', role: 'ADMIN', email: 'admin@nova-loja.com', pinHash: 'hashed-pin' },
    })
    expect(result.createdAdminPin).toBe('9876')
  })

  it('never creates a second admin or returns a pin when one already exists (idempotente)', async () => {
    const { prisma, create } = makePrisma({ existingAdmin: { id: 'op_existing' } })
    const result = await provisionTenant(
      prisma as never,
      { slug: 'nova-loja', name: 'Nova Loja' },
      { name: 'Admin', pin: '1234' },
    )
    expect(create).not.toHaveBeenCalled()
    expect(result.createdAdminPin).toBeNull()
  })
})
