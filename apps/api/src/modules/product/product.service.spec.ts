import type { Product as ProductRow } from '@prisma/client'
import { ProductRepository } from './product.repository'
import { ProductService } from './product.service'

const row: ProductRow = {
  id: 'p1',
  tenantId: 't1',
  name: 'Arroz 5kg',
  category: 'Estiva',
  unit: 'UN',
  barcode: '789',
  salePriceCents: 2890,
  costPriceCents: 2100,
  stockQuantity: 20,
  minStock: 5,
  photoUrl: null,
  createdAt: new Date('2026-01-01'),
  deletedAt: null,
}

const input = {
  name: 'Arroz 5kg',
  category: 'Estiva',
  unit: 'UN' as const,
  barcode: '789',
  salePriceCents: 2890,
  costPriceCents: 2100,
  stockQuantity: 20,
  minStock: 5,
}

function makeService(overrides: Partial<Record<keyof ProductRepository, jest.Mock>> = {}) {
  const repository = {
    findMany: jest.fn().mockResolvedValue([row]),
    findById: jest.fn().mockResolvedValue(null),
    findByBarcode: jest.fn().mockResolvedValue(null),
    findCategories: jest.fn().mockResolvedValue(['Estiva']),
    create: jest.fn().mockImplementation(async (_t: string, data: typeof input) => ({ ...row, ...data })),
    update: jest.fn().mockImplementation(async (_t: string, _id: string, data: Partial<typeof input>) => ({ ...row, ...data })),
    softDelete: jest.fn().mockResolvedValue({ ...row, deletedAt: new Date(), barcode: null }),
    ...overrides,
  }
  return { service: new ProductService(repository as unknown as ProductRepository), repository }
}

describe('ProductService', () => {
  describe('list / get', () => {
    it('lists products scoped to the tenant with the search query, without Prisma-only fields', async () => {
      const { service, repository } = makeService()
      const result = await service.list('t1', { search: 'arroz' })
      expect(repository.findMany).toHaveBeenCalledWith('t1', { search: 'arroz' })
      expect(result[0]).not.toHaveProperty('tenantId')
      expect(result[0]).not.toHaveProperty('deletedAt')
      expect(result[0]).toMatchObject({ id: 'p1', name: 'Arroz 5kg', salePriceCents: 2890 })
    })

    it('throws PRODUCT_NOT_FOUND for an unknown or other-tenant id', async () => {
      const { service } = makeService()
      await expect(service.get('t1', 'nope')).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 })
    })
  })

  describe('create', () => {
    it('creates when the barcode is free', async () => {
      const { service, repository } = makeService()
      await expect(service.create('t1', input)).resolves.toMatchObject({ barcode: '789' })
      expect(repository.findByBarcode).toHaveBeenCalledWith('t1', '789')
      expect(repository.create).toHaveBeenCalledWith('t1', input)
    })

    it('rejects a barcode already used in the tenant with 409 BARCODE_IN_USE', async () => {
      const { service, repository } = makeService({ findByBarcode: jest.fn().mockResolvedValue(row) })
      await expect(service.create('t1', input)).rejects.toMatchObject({ code: 'BARCODE_IN_USE', statusCode: 409 })
      expect(repository.create).not.toHaveBeenCalled()
    })

    // O schema já normaliza "" para null; o service repete a normalização por segurança.
    it.each([null, '', '  '])('stores %p barcode as null and skips the uniqueness check', async (barcode) => {
      const { service, repository } = makeService()
      await service.create('t1', { ...input, barcode })
      expect(repository.findByBarcode).not.toHaveBeenCalled()
      expect(repository.create).toHaveBeenCalledWith('t1', expect.objectContaining({ barcode: null }))
    })
  })

  describe('update', () => {
    it('throws PRODUCT_NOT_FOUND when the product is not in the tenant', async () => {
      const { service } = makeService()
      await expect(service.update('t1', 'p1', { name: 'x' })).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' })
    })

    it('updates fields without touching the barcode when it is not sent', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(row) })
      await service.update('t1', 'p1', { salePriceCents: 3000 })
      expect(repository.findByBarcode).not.toHaveBeenCalled()
      expect(repository.update).toHaveBeenCalledWith('t1', 'p1', { salePriceCents: 3000 })
    })

    it('keeps its own barcode without a conflict', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(row) })
      await expect(service.update('t1', 'p1', { barcode: '789' })).resolves.toBeDefined()
      expect(repository.findByBarcode).not.toHaveBeenCalled()
    })

    it('rejects changing to a barcode owned by another product', async () => {
      const { service } = makeService({
        findById: jest.fn().mockResolvedValue(row),
        findByBarcode: jest.fn().mockResolvedValue({ ...row, id: 'p2', barcode: '111' }),
      })
      await expect(service.update('t1', 'p1', { barcode: '111' })).rejects.toMatchObject({ code: 'BARCODE_IN_USE' })
    })

    it('allows clearing the barcode', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(row) })
      await service.update('t1', 'p1', { barcode: '' })
      expect(repository.update).toHaveBeenCalledWith('t1', 'p1', { barcode: null })
    })
  })

  describe('remove', () => {
    it('soft-deletes an existing product of the tenant', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(row) })
      await service.remove('t1', 'p1')
      expect(repository.softDelete).toHaveBeenCalledWith('t1', 'p1')
    })

    it('throws PRODUCT_NOT_FOUND for an unknown, deleted or other-tenant id', async () => {
      const { service, repository } = makeService()
      await expect(service.remove('t1', 'p1')).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' })
      expect(repository.softDelete).not.toHaveBeenCalled()
    })
  })
})
