import { DashboardRepository, type DashboardSaleRow } from './dashboard.repository'
import { DashboardService } from './dashboard.service'

// "Agora": 12/09/2026 às 23:30 em São Paulo = 13/09 02:30 UTC.
const now = new Date('2026-09-13T02:30:00.000Z')

function sale(
  soldAt: string,
  totalCents: number,
  paymentMethod: DashboardSaleRow['paymentMethod'],
  items: DashboardSaleRow['items'] = [],
): DashboardSaleRow {
  return { soldAt: new Date(soldAt), totalCents, paymentMethod, items }
}

function makeService(sales: DashboardSaleRow[], timezone: string | null = 'America/Sao_Paulo') {
  const repository = {
    findTimeZone: jest.fn().mockResolvedValue(timezone),
    findSalesBetween: jest.fn().mockResolvedValue(sales),
    findProductPhotos: jest.fn().mockResolvedValue(new Map([['a', 'https://cdn.example/a.png']])),
  }
  return { service: new DashboardService(repository as unknown as DashboardRepository), repository }
}

describe('DashboardService.summary', () => {
  it('asks for the 7 store days ending today, in UTC instants', async () => {
    const { service, repository } = makeService([])
    await service.summary('t1', now)
    // 06/09 00:00 SP = 06/09 03:00Z ; 13/09 00:00 SP = 13/09 03:00Z
    expect(repository.findSalesBetween).toHaveBeenCalledWith(
      't1',
      new Date('2026-09-06T03:00:00.000Z'),
      new Date('2026-09-13T03:00:00.000Z'),
    )
  })

  it('counts a late-night sale as today in the store time zone and splits by payment method', async () => {
    const { service } = makeService([
      sale('2026-09-13T01:00:00.000Z', 1000, 'CASH'), // 22:00 de 12/09 em SP
      sale('2026-09-12T15:00:00.000Z', 2500, 'PIX'),
      sale('2026-09-12T16:00:00.000Z', 500, 'CASH'),
    ])
    const summary = await service.summary('t1', now)
    expect(summary.today).toEqual({
      date: '2026-09-12',
      totalCents: 4000,
      salesCount: 3,
      byPaymentMethod: { CASH: 1500, CARD: 0, PIX: 2500 },
    })
  })

  it('always returns 7 days oldest-first, zero-filled', async () => {
    const { service } = makeService([sale('2026-09-10T12:00:00.000Z', 800, 'CARD')])
    const summary = await service.summary('t1', now)
    expect(summary.week.map((day) => day.date)).toEqual([
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
    ])
    expect(summary.week[4]).toEqual({ date: '2026-09-10', totalCents: 800, salesCount: 1 })
    expect(summary.week[0]).toEqual({ date: '2026-09-06', totalCents: 0, salesCount: 0 })
  })

  it("ranks today's products by quantity (then value), merging lines and capping at 5", async () => {
    const item = (productId: string, quantity: number, unitPriceCents: number) => ({
      productId,
      productName: `Produto ${productId}`,
      quantity,
      unitPriceCents,
    })
    const { service } = makeService([
      sale('2026-09-12T12:00:00.000Z', 0, 'CASH', [item('a', 2, 100), item('b', 5, 10)]),
      sale('2026-09-12T13:00:00.000Z', 0, 'CASH', [item('a', 3, 100), item('c', 5, 20)]),
      sale('2026-09-12T14:00:00.000Z', 0, 'CASH', [item('d', 1, 1), item('e', 1, 1), item('f', 1, 1), item('g', 1, 1)]),
      sale('2026-09-11T14:00:00.000Z', 0, 'CASH', [item('z', 99, 1)]), // ontem: fora
    ])
    const summary = await service.summary('t1', now)
    expect(summary.topProductsToday).toHaveLength(5)
    expect(summary.topProductsToday.slice(0, 3)).toEqual([
      { productId: 'a', name: 'Produto a', quantity: 5, totalCents: 500, photoUrl: 'https://cdn.example/a.png' },
      { productId: 'c', name: 'Produto c', quantity: 5, totalCents: 100, photoUrl: null },
      { productId: 'b', name: 'Produto b', quantity: 5, totalCents: 50, photoUrl: null },
    ])
    expect(summary.topProductsToday.map((p) => p.productId)).not.toContain('z')
  })

  it('falls back to UTC when the tenant time zone is missing or invalid', async () => {
    const { service, repository } = makeService([], 'Mars/Olympus')
    const summary = await service.summary('t1', now)
    expect(summary.today.date).toBe('2026-09-13')
    expect(repository.findSalesBetween).toHaveBeenCalledWith(
      't1',
      new Date('2026-09-07T00:00:00.000Z'),
      new Date('2026-09-14T00:00:00.000Z'),
    )
  })
})
