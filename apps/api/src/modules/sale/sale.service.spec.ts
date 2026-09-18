import type { Product } from '@prisma/client'
import type { CashSessionService } from '../cash-session/cash-session.service'
import type { TenantService } from '../tenant/tenant.service'
import { addDaysToDayKey, startOfDayInTimeZone } from '../../common/utils/time-zone'
import { ConflictError } from '../../common/errors/domain.error'
import { SaleRepository, StockRaceError, type NewSale } from './sale.repository'
import { SaleService } from './sale.service'

const STORE_TIME_ZONE = 'America/Sao_Paulo'
function makeTenants(overrides: Partial<Record<keyof TenantService, jest.Mock>> = {}) {
  return {
    getCurrent: jest.fn().mockResolvedValue({ timezone: STORE_TIME_ZONE }),
    ...overrides,
  }
}

const operator = { id: 'op1', tenantId: 't1', role: 'OPERATOR' as const }
const uuid = '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab'

const beer: Product = {
  id: 'p1',
  tenantId: 't1',
  name: 'Cerveja Lata 350ml',
  category: 'Bebidas',
  unit: 'UN',
  barcode: null,
  salePriceCents: 399,
  costPriceCents: 260,
  stockQuantity: 3,
  minStock: 24,
  photoUrl: null,
  createdAt: new Date(),
  deletedAt: null,
}
const rice: Product = { ...beer, id: 'p2', name: 'Arroz 5kg', salePriceCents: 2890, stockQuantity: 20 }

function makeService(overrides: Partial<Record<keyof SaleRepository, jest.Mock>> = {}, openSession: boolean = true) {
  const repository = {
    findByUuid: jest.fn().mockResolvedValue(null),
    findProducts: jest.fn().mockResolvedValue([beer, rice]),
    createWithStockDebit: jest.fn().mockImplementation(async (_t: string, sale: NewSale) => ({
      id: 's1',
      tenantId: 't1',
      ...sale,
      operator: { name: 'Karol' },
      items: sale.items.map((item, index) => ({ id: `i${index}`, saleId: 's1', ...item })),
    })),
    ...overrides,
  }
  const cashSessions = {
    requireOpen: openSession
      ? jest.fn().mockResolvedValue({ id: 'cs1' })
      : jest.fn().mockRejectedValue(new ConflictError('CASH_SESSION_NOT_OPEN', 'Abra o caixa antes de vender.')),
  }
  const tenants = makeTenants()
  const service = new SaleService(
    repository as unknown as SaleRepository,
    cashSessions as unknown as CashSessionService,
    tenants as unknown as TenantService,
  )
  return { service, repository, cashSessions, tenants }
}

describe('SaleService.create', () => {
  const input = {
    uuid,
    paymentMethod: 'PIX' as const,
    items: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ],
  }

  it('creates the sale in the open session with frozen prices, computed total and stock debit', async () => {
    const { service, repository } = makeService()
    const sale = await service.create('t1', operator, input)
    expect(repository.createWithStockDebit).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        uuid,
        cashSessionId: 'cs1',
        operatorId: 'op1',
        paymentMethod: 'PIX',
        totalCents: 2 * 399 + 2890,
        items: [
          { productId: 'p1', productName: 'Cerveja Lata 350ml', quantity: 2, unitPriceCents: 399 },
          { productId: 'p2', productName: 'Arroz 5kg', quantity: 1, unitPriceCents: 2890 },
        ],
      }),
    )
    expect(sale).toMatchObject({ uuid, totalCents: 3688, operatorName: 'Karol', paymentMethod: 'PIX' })
  })

  it('is idempotent: an existing uuid returns the stored sale without creating or debiting again', async () => {
    const existing = {
      id: 's0',
      uuid,
      tenantId: 't1',
      cashSessionId: 'cs1',
      operatorId: 'op1',
      paymentMethod: 'CASH',
      totalCents: 100,
      soldAt: new Date(),
      operator: { name: 'Karol' },
      items: [],
    }
    const { service, repository, cashSessions } = makeService({ findByUuid: jest.fn().mockResolvedValue(existing) })
    const sale = await service.create('t1', operator, input)
    expect(sale.id).toBe('s0')
    expect(repository.createWithStockDebit).not.toHaveBeenCalled()
    expect(cashSessions.requireOpen).not.toHaveBeenCalled()
  })

  it('refuses to sell without an open cash session', async () => {
    const { service, repository } = makeService({}, false)
    await expect(service.create('t1', operator, input)).rejects.toMatchObject({
      code: 'CASH_SESSION_NOT_OPEN',
      statusCode: 409,
    })
    expect(repository.createWithStockDebit).not.toHaveBeenCalled()
  })

  it('rejects an unknown or deleted product with PRODUCT_NOT_FOUND and its id', async () => {
    const { service } = makeService({ findProducts: jest.fn().mockResolvedValue([beer]) })
    await expect(service.create('t1', operator, input)).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
      details: { productId: 'p2' },
    })
  })

  it('blocks a quantity above stock with INSUFFICIENT_STOCK naming the product and the available amount', async () => {
    const { service, repository } = makeService()
    await expect(
      service.create('t1', operator, { ...input, items: [{ productId: 'p1', quantity: 4 }] }),
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      statusCode: 409,
      message: 'Estoque insuficiente: só há 3 unidades de "Cerveja Lata 350ml".',
      details: { productId: 'p1', available: 3 },
    })
    expect(repository.createWithStockDebit).not.toHaveBeenCalled()
  })

  it('says "sem estoque" when there is nothing left', async () => {
    const { service } = makeService({
      findProducts: jest.fn().mockResolvedValue([{ ...beer, stockQuantity: 0 }, rice]),
    })
    await expect(
      service.create('t1', operator, { ...input, items: [{ productId: 'p1', quantity: 1 }] }),
    ).rejects.toMatchObject({
      message: '"Cerveja Lata 350ml" está sem estoque.',
    })
  })

  it('merges repeated product lines before checking stock', async () => {
    const { service, repository } = makeService()
    await expect(
      service.create('t1', operator, {
        ...input,
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p1', quantity: 2 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
    expect(repository.createWithStockDebit).not.toHaveBeenCalled()
  })

  it('uses the current product price, ignoring any price the client might send', async () => {
    const { service, repository } = makeService()
    await service.create('t1', operator, {
      ...input,
      items: [{ productId: 'p2', quantity: 1, unitPriceCents: 1 } as never],
    })
    expect(repository.createWithStockDebit).toHaveBeenCalledWith('t1', expect.objectContaining({ totalCents: 2890 }))
  })

  it('maps a concurrent stock race into INSUFFICIENT_STOCK', async () => {
    const { service } = makeService({ createWithStockDebit: jest.fn().mockRejectedValue(new StockRaceError('p1')) })
    await expect(service.create('t1', operator, input)).rejects.toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: { productId: 'p1', available: null },
    })
  })

  describe('change (troco) for cash sales', () => {
    it('stores the received amount and computes the change server-side', async () => {
      const { service, repository } = makeService()
      const sale = await service.create('t1', operator, { ...input, paymentMethod: 'CASH', amountReceivedCents: 5000 })
      expect(repository.createWithStockDebit).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ totalCents: 3688, amountReceivedCents: 5000, changeCents: 1312 }),
      )
      expect(sale).toMatchObject({ amountReceivedCents: 5000, changeCents: 1312 })
    })

    it('rejects a received amount below the total with INSUFFICIENT_CASH, without creating the sale', async () => {
      const { service, repository } = makeService()
      await expect(
        service.create('t1', operator, { ...input, paymentMethod: 'CASH', amountReceivedCents: 3000 }),
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_CASH',
        statusCode: 400,
        details: { totalCents: 3688, amountReceivedCents: 3000 },
      })
      expect(repository.createWithStockDebit).not.toHaveBeenCalled()
    })

    it('accepts the exact total as received (zero change)', async () => {
      const { service } = makeService()
      const sale = await service.create('t1', operator, { ...input, paymentMethod: 'CASH', amountReceivedCents: 3688 })
      expect(sale.changeCents).toBe(0)
    })

    it('leaves both fields null when the operator did not enter the received amount', async () => {
      const { service } = makeService()
      const sale = await service.create('t1', operator, { ...input, paymentMethod: 'CASH' })
      expect(sale).toMatchObject({ amountReceivedCents: null, changeCents: null })
    })

    it('ignores the received amount for card and pix', async () => {
      const { service } = makeService()
      const sale = await service.create('t1', operator, { ...input, paymentMethod: 'PIX', amountReceivedCents: 100 })
      expect(sale).toMatchObject({ amountReceivedCents: null, changeCents: null })
    })
  })

  it('keeps soldAt from the client when provided (offline queue)', async () => {
    const { service, repository } = makeService()
    await service.create('t1', operator, { ...input, soldAt: '2026-09-12T10:00:00.000Z' })
    expect(repository.createWithStockDebit).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ soldAt: new Date('2026-09-12T10:00:00.000Z') }),
    )
  })
})

// Repositório com estoque que de fato debita entre chamadas — syncBatch
// processa em ordem, então uma venda do lote pode esgotar o estoque da
// próxima (mesmo jeito que aconteceria se cada uma tivesse vindo online).
function makeStatefulService(startingStock: Record<string, number> = { p1: 3, p2: 20 }) {
  const stock: Record<string, number> = { ...startingStock }
  const existingUuids = new Set<string>()
  const repository = {
    findByUuid: jest.fn().mockImplementation(async (_t: string, uuid: string) =>
      existingUuids.has(uuid)
        ? {
            id: `existing-${uuid}`,
            uuid,
            cashSessionId: 'cs1',
            operatorId: 'op1',
            paymentMethod: 'PIX',
            totalCents: 100,
            amountReceivedCents: null,
            changeCents: null,
            soldAt: new Date(),
            operator: { name: 'Karol' },
            items: [],
          }
        : null,
    ),
    findProducts: jest
      .fn()
      .mockImplementation(async (_t: string, ids: string[]) =>
        [beer, rice].filter((p) => ids.includes(p.id)).map((p) => ({ ...p, stockQuantity: stock[p.id] ?? 0 })),
      ),
    createWithStockDebit: jest.fn().mockImplementation(async (_t: string, sale: NewSale) => {
      for (const item of sale.items) stock[item.productId] = (stock[item.productId] ?? 0) - item.quantity
      return {
        id: `s-${sale.uuid}`,
        tenantId: 't1',
        ...sale,
        operator: { name: 'Karol' },
        items: sale.items.map((item, index) => ({ id: `i${index}`, saleId: `s-${sale.uuid}`, ...item })),
      }
    }),
  }
  const cashSessions = { requireOpen: jest.fn().mockResolvedValue({ id: 'cs1' }) }
  const service = new SaleService(
    repository as unknown as SaleRepository,
    cashSessions as unknown as CashSessionService,
    makeTenants() as unknown as TenantService,
  )
  return { service, repository, stock, existingUuids }
}

describe('SaleService.syncBatch', () => {
  const uuid1 = '11111111-1111-1111-1111-111111111111'
  const uuid2 = '22222222-2222-2222-2222-222222222222'

  it('syncs every sale in the batch, in order', async () => {
    const { service, repository } = makeStatefulService()
    const result = await service.syncBatch('t1', operator, {
      sales: [
        { uuid: uuid1, paymentMethod: 'PIX', items: [{ productId: 'p2', quantity: 1 }] },
        { uuid: uuid2, paymentMethod: 'CASH', items: [{ productId: 'p1', quantity: 1 }] },
      ],
    })
    expect(result.results).toEqual([
      { uuid: uuid1, ok: true, sale: expect.objectContaining({ uuid: uuid1 }) },
      { uuid: uuid2, ok: true, sale: expect.objectContaining({ uuid: uuid2 }) },
    ])
    expect(repository.createWithStockDebit).toHaveBeenCalledTimes(2)
  })

  it('does not duplicate a sale whose uuid already exists (idempotent re-sync)', async () => {
    const { service, repository, existingUuids } = makeStatefulService()
    existingUuids.add(uuid1)
    const result = await service.syncBatch('t1', operator, {
      sales: [{ uuid: uuid1, paymentMethod: 'PIX', items: [{ productId: 'p2', quantity: 1 }] }],
    })
    expect(result.results).toEqual([{ uuid: uuid1, ok: true, sale: expect.objectContaining({ uuid: uuid1 }) }])
    expect(repository.createWithStockDebit).not.toHaveBeenCalled()
  })

  it('keeps a failed sale from blocking the rest of the batch', async () => {
    // p1 (Cerveja) só tem 3 em estoque: a primeira venda do lote esgota,
    // a segunda falha, a terceira (outro produto) segue normal.
    const { service, repository } = makeStatefulService({ p1: 3, p2: 20 })
    const result = await service.syncBatch('t1', operator, {
      sales: [
        { uuid: uuid1, paymentMethod: 'PIX', items: [{ productId: 'p1', quantity: 3 }] },
        { uuid: uuid2, paymentMethod: 'PIX', items: [{ productId: 'p1', quantity: 1 }] },
        {
          uuid: '33333333-3333-3333-3333-333333333333',
          paymentMethod: 'PIX',
          items: [{ productId: 'p2', quantity: 1 }],
        },
      ],
    })
    expect(result.results[0]).toMatchObject({ uuid: uuid1, ok: true })
    expect(result.results[1]).toMatchObject({
      uuid: uuid2,
      ok: false,
      error: { code: 'INSUFFICIENT_STOCK', statusCode: 409, details: { productId: 'p1', available: 0 } },
    })
    expect(result.results[2]).toMatchObject({ ok: true })
    expect(repository.createWithStockDebit).toHaveBeenCalledTimes(2)
  })

  it('lets an unexpected (non-domain) error escape instead of swallowing it as a per-item result', async () => {
    const repository = {
      findByUuid: jest.fn().mockResolvedValue(null),
      findProducts: jest.fn().mockRejectedValue(new Error('db down')),
      createWithStockDebit: jest.fn(),
    }
    const cashSessions = { requireOpen: jest.fn().mockResolvedValue({ id: 'cs1' }) }
    const brokenService = new SaleService(
      repository as unknown as SaleRepository,
      cashSessions as unknown as CashSessionService,
      makeTenants() as unknown as TenantService,
    )
    await expect(
      brokenService.syncBatch('t1', operator, {
        sales: [{ uuid: uuid1, paymentMethod: 'PIX', items: [{ productId: 'p1', quantity: 1 }] }],
      }),
    ).rejects.toThrow('db down')
  })
})

describe('SaleService.history', () => {
  const now = new Date('2026-09-18T15:00:00.000Z') // 12h em America/Sao_Paulo, mesmo dia
  const emptyRow = { id: 's1', tenantId: 't1', operator: { name: 'Karol' }, items: [] }

  function makeHistoryService() {
    const repository = { findHistory: jest.fn().mockResolvedValue([]) }
    const tenants = makeTenants()
    const service = new SaleService(
      repository as unknown as SaleRepository,
      {} as unknown as CashSessionService,
      tenants as unknown as TenantService,
    )
    return { service, repository }
  }

  it('resolves "today" to the store\'s current day', async () => {
    const { service, repository } = makeHistoryService()
    await service.history('t1', { period: 'today' }, now)
    const from = startOfDayInTimeZone('2026-09-18', STORE_TIME_ZONE)
    const to = startOfDayInTimeZone('2026-09-19', STORE_TIME_ZONE)
    expect(repository.findHistory).toHaveBeenCalledWith('t1', from, to, undefined)
  })

  it('resolves "yesterday" to the day before the store\'s current day', async () => {
    const { service, repository } = makeHistoryService()
    await service.history('t1', { period: 'yesterday' }, now)
    const from = startOfDayInTimeZone(addDaysToDayKey('2026-09-18', -1), STORE_TIME_ZONE)
    const to = startOfDayInTimeZone('2026-09-18', STORE_TIME_ZONE)
    expect(repository.findHistory).toHaveBeenCalledWith('t1', from, to, undefined)
  })

  it('uses the given date for period "day"', async () => {
    const { service, repository } = makeHistoryService()
    await service.history('t1', { period: 'day', date: '2026-01-05' }, now)
    const from = startOfDayInTimeZone('2026-01-05', STORE_TIME_ZONE)
    const to = startOfDayInTimeZone('2026-01-06', STORE_TIME_ZONE)
    expect(repository.findHistory).toHaveBeenCalledWith('t1', from, to, undefined)
  })

  it('passes the product search through to the repository', async () => {
    const { service, repository } = makeHistoryService()
    await service.history('t1', { period: 'today', search: 'Coca' }, now)
    expect(repository.findHistory).toHaveBeenCalledWith('t1', expect.any(Date), expect.any(Date), 'Coca')
  })

  it('maps repository rows through the same Sale shape as create()', async () => {
    const { service, repository } = makeHistoryService()
    repository.findHistory.mockResolvedValue([{ ...emptyRow, soldAt: now }])
    const result = await service.history('t1', { period: 'today' }, now)
    expect(result).toEqual([expect.objectContaining({ id: 's1', operatorName: 'Karol' })])
  })
})
