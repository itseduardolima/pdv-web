import type { ReportSummaryQuery } from '@pdv/shared'
import { ReportsRepository, type ReportProductRow, type ReportSaleRow } from './reports.repository'
import { ReportsService } from './reports.service'

// "Agora": 13/09/2026 às 12:00 em São Paulo (15:00 UTC) — bem no meio do
// dia, sem risco de virada de fuso confundir o teste.
const now = new Date('2026-09-13T15:00:00.000Z')

function sale(
  soldAt: string,
  totalCents: number,
  paymentMethod: ReportSaleRow['paymentMethod'],
  operatorId = 'op1',
  operatorName = 'Karol',
  items: ReportSaleRow['items'] = [],
): ReportSaleRow {
  return { soldAt: new Date(soldAt), totalCents, paymentMethod, operatorId, operatorName, items }
}

function makeService(
  sales: ReportSaleRow[],
  overrides: Partial<Record<keyof ReportsRepository, jest.Mock>> = {},
  timezone: string | null = 'America/Sao_Paulo',
) {
  const repository = {
    findTimeZone: jest.fn().mockResolvedValue(timezone),
    findSalesBetween: jest.fn().mockResolvedValue(sales),
    sumTotalBetween: jest.fn().mockResolvedValue(0),
    findActiveProducts: jest.fn().mockResolvedValue([] as ReportProductRow[]),
    findProductPhotos: jest.fn().mockResolvedValue(new Map()),
    ...overrides,
  }
  return { service: new ReportsService(repository as unknown as ReportsRepository), repository }
}

const today: ReportSummaryQuery = { period: 'today' }
const week: ReportSummaryQuery = { period: 'week' }
const month: ReportSummaryQuery = { period: 'month' }
const year: ReportSummaryQuery = { period: 'year' }

describe('ReportsService.summary', () => {
  describe('period resolution (HU 12.1)', () => {
    it('resolves "today" to a single store day', async () => {
      const { service, repository } = makeService([])
      const summary = await service.summary('t1', today, now)
      expect(summary.from).toBe('2026-09-13')
      expect(summary.to).toBe('2026-09-13')
      // 13/09 00:00 SP = 13/09 03:00Z ; 14/09 00:00 SP = 14/09 03:00Z
      expect(repository.findSalesBetween).toHaveBeenCalledWith(
        't1',
        new Date('2026-09-13T03:00:00.000Z'),
        new Date('2026-09-14T03:00:00.000Z'),
      )
    })

    it('resolves "week" to the 7 store days ending today', async () => {
      const { service } = makeService([])
      const summary = await service.summary('t1', week, now)
      expect(summary.from).toBe('2026-09-07')
      expect(summary.to).toBe('2026-09-13')
      expect(summary.days).toHaveLength(7)
    })

    it('resolves "month" to the calendar month, from the 1st to its last day', async () => {
      const { service } = makeService([])
      const summary = await service.summary('t1', month, now)
      expect(summary.from).toBe('2026-09-01')
      // Setembro tem 30 dias — inclui dias futuros do mês (17 a 30), que
      // entram zerados no gráfico (ver "months" para o mesmo raciocínio em "Ano").
      expect(summary.to).toBe('2026-09-30')
      expect(summary.days).toHaveLength(30)
    })

    it('resolves "year" to the calendar year, from Jan 1st to today', async () => {
      const { service } = makeService([])
      const summary = await service.summary('t1', year, now)
      expect(summary.from).toBe('2026-01-01')
      expect(summary.to).toBe('2026-09-13')
      // Jan 1 to Sep 13, 2026: 256 days.
      expect(summary.days).toHaveLength(256)
    })

    it('resolves "custom" to the exact from/to given', async () => {
      const custom: ReportSummaryQuery = { period: 'custom', from: '2026-08-01', to: '2026-08-05' }
      const { service } = makeService([])
      const summary = await service.summary('t1', custom, now)
      expect(summary.from).toBe('2026-08-01')
      expect(summary.to).toBe('2026-08-05')
      expect(summary.days).toHaveLength(5)
    })

    it('falls back to UTC when the tenant time zone is missing or invalid', async () => {
      const { service } = makeService([], {}, 'Mars/Olympus')
      const summary = await service.summary('t1', today, now)
      expect(summary.from).toBe('2026-09-13')
    })
  })

  describe('total, count and payment breakdown', () => {
    it('sums totals, counts sales and splits by payment method', async () => {
      const { service } = makeService([
        sale('2026-09-13T14:00:00.000Z', 1000, 'CASH'),
        sale('2026-09-13T15:00:00.000Z', 2500, 'PIX'),
        sale('2026-09-13T16:00:00.000Z', 500, 'CASH'),
      ])
      const summary = await service.summary('t1', today, now)
      expect(summary.totalCents).toBe(4000)
      expect(summary.salesCount).toBe(3)
      expect(summary.byPaymentMethod).toEqual({ CASH: 1500, CARD: 0, PIX: 2500 })
    })
  })

  describe('previous period comparison (HU 12.2)', () => {
    it('queries the immediately preceding period of the same duration', async () => {
      const { service, repository } = makeService([], { sumTotalBetween: jest.fn().mockResolvedValue(1000) })
      await service.summary('t1', week, now) // 07/09..13/09, 7 dias
      // período anterior: 31/08..06/09 (7 dias, termina no dia antes do "from")
      expect(repository.sumTotalBetween).toHaveBeenCalledWith(
        't1',
        new Date('2026-08-31T03:00:00.000Z'),
        new Date('2026-09-07T03:00:00.000Z'),
      )
    })

    it('computes a positive delta percent vs the previous period', async () => {
      const { service } = makeService([sale('2026-09-13T14:00:00.000Z', 1200, 'CASH')], {
        sumTotalBetween: jest.fn().mockResolvedValue(1000),
      })
      const summary = await service.summary('t1', today, now)
      expect(summary.previousPeriod).toEqual({ totalCents: 1000, deltaPercent: 20 })
    })

    it('returns deltaPercent null when the previous period had no sales (avoids division by zero)', async () => {
      const { service } = makeService([sale('2026-09-13T14:00:00.000Z', 1200, 'CASH')], {
        sumTotalBetween: jest.fn().mockResolvedValue(0),
      })
      const summary = await service.summary('t1', today, now)
      expect(summary.previousPeriod).toEqual({ totalCents: 0, deltaPercent: null })
    })
  })

  describe('days (chart, HU 12.4)', () => {
    it('returns one zero-filled entry per day in the range, oldest first', async () => {
      const { service } = makeService([sale('2026-09-10T14:00:00.000Z', 800, 'CARD')])
      const summary = await service.summary('t1', week, now)
      expect(summary.days.map((d) => d.date)).toEqual([
        '2026-09-07',
        '2026-09-08',
        '2026-09-09',
        '2026-09-10',
        '2026-09-11',
        '2026-09-12',
        '2026-09-13',
      ])
      expect(summary.days[3]).toEqual({ date: '2026-09-10', totalCents: 800, salesCount: 1 })
      expect(summary.days[0]).toEqual({ date: '2026-09-07', totalCents: 0, salesCount: 0 })
    })
  })

  describe('hours (chart for "Hoje", HU 12.4)', () => {
    it('returns 24 zero-filled hours, in the store time zone, only for period=today', async () => {
      const { service } = makeService([
        sale('2026-09-13T14:30:00.000Z', 1000, 'CASH'), // 11:30 em SP -> hora 11
        sale('2026-09-13T23:10:00.000Z', 500, 'PIX'), // 20:10 em SP -> hora 20
      ])
      const summary = await service.summary('t1', today, now)
      expect(summary.hours).toHaveLength(24)
      expect(summary.hours[11]).toEqual({ hour: 11, totalCents: 1000, salesCount: 1 })
      expect(summary.hours[20]).toEqual({ hour: 20, totalCents: 500, salesCount: 1 })
      expect(summary.hours[0]).toEqual({ hour: 0, totalCents: 0, salesCount: 0 })
    })

    it('is empty for any period other than "today" — an hourly axis only makes sense within one day', async () => {
      const { service } = makeService([sale('2026-09-10T14:00:00.000Z', 800, 'CARD')])
      const summary = await service.summary('t1', week, now)
      expect(summary.hours).toEqual([])
    })
  })

  describe('months (chart for "Ano", HU 12.4)', () => {
    it('returns 12 zero-filled months, in the store time zone, only for period=year', async () => {
      const { service } = makeService([
        sale('2026-03-05T14:30:00.000Z', 1000, 'CASH'), // março
        sale('2026-09-13T23:10:00.000Z', 500, 'PIX'), // 20:10 em SP -> ainda 13/09
      ])
      const summary = await service.summary('t1', year, now)
      expect(summary.months).toHaveLength(12)
      expect(summary.months[2]).toEqual({ month: 3, totalCents: 1000, salesCount: 1 })
      expect(summary.months[8]).toEqual({ month: 9, totalCents: 500, salesCount: 1 })
      expect(summary.months[0]).toEqual({ month: 1, totalCents: 0, salesCount: 0 })
    })

    it('is empty for any period other than "year"', async () => {
      const { service } = makeService([sale('2026-09-10T14:00:00.000Z', 800, 'CARD')])
      const summary = await service.summary('t1', week, now)
      expect(summary.months).toEqual([])
    })
  })

  describe('top products (HU 12.5)', () => {
    it('ranks by quantity, then value, merges lines, caps at 5 and attaches current photos', async () => {
      const item = (productId: string, quantity: number, unitPriceCents: number) => ({
        productId,
        productName: `Produto ${productId}`,
        quantity,
        unitPriceCents,
      })
      const { service } = makeService(
        [
          sale('2026-09-13T12:00:00.000Z', 0, 'CASH', 'op1', 'Karol', [item('a', 2, 100), item('b', 5, 10)]),
          sale('2026-09-13T13:00:00.000Z', 0, 'CASH', 'op1', 'Karol', [item('a', 3, 100), item('c', 5, 20)]),
          sale('2026-09-13T14:00:00.000Z', 0, 'CASH', 'op1', 'Karol', [
            item('d', 1, 1),
            item('e', 1, 1),
            item('f', 1, 1),
            item('g', 1, 1),
          ]),
        ],
        { findProductPhotos: jest.fn().mockResolvedValue(new Map([['a', 'https://cdn.example/a.png']])) },
      )
      const summary = await service.summary('t1', today, now)
      expect(summary.topProducts).toHaveLength(5)
      expect(summary.topProducts.slice(0, 3)).toEqual([
        { productId: 'a', name: 'Produto a', quantity: 5, totalCents: 500, photoUrl: 'https://cdn.example/a.png' },
        { productId: 'c', name: 'Produto c', quantity: 5, totalCents: 100, photoUrl: null },
        { productId: 'b', name: 'Produto b', quantity: 5, totalCents: 50, photoUrl: null },
      ])
    })
  })

  describe('by operator (HU 12.6)', () => {
    it('sums totals per operator and computes each one’s percent of the period total', async () => {
      const { service } = makeService([
        sale('2026-09-13T12:00:00.000Z', 3000, 'CASH', 'op1', 'Karol'),
        sale('2026-09-13T13:00:00.000Z', 1000, 'PIX', 'op2', 'Rafael'),
      ])
      const summary = await service.summary('t1', today, now)
      expect(summary.byOperator).toEqual([
        { operatorId: 'op1', name: 'Karol', totalCents: 3000, percent: 75 },
        { operatorId: 'op2', name: 'Rafael', totalCents: 1000, percent: 25 },
      ])
    })
  })

  describe('stagnant products (HU 12.7)', () => {
    it('includes active products with zero sales in the period, not just the worst sellers', async () => {
      const item = (productId: string, quantity: number) => ({
        productId,
        productName: productId,
        quantity,
        unitPriceCents: 100,
      })
      const { service } = makeService(
        [sale('2026-09-13T12:00:00.000Z', 0, 'CASH', 'op1', 'Karol', [item('sold-a-lot', 50)])],
        {
          findActiveProducts: jest.fn().mockResolvedValue([
            { id: 'sold-a-lot', name: 'Vendeu muito', photoUrl: null },
            { id: 'never-sold', name: 'Nunca vendeu', photoUrl: null },
          ]),
        },
      )
      const summary = await service.summary('t1', today, now)
      expect(summary.stagnantProducts).toEqual([
        { productId: 'never-sold', name: 'Nunca vendeu', photoUrl: null, quantitySold: 0 },
      ])
    })

    it('excludes products above the stagnant threshold', async () => {
      const item = (productId: string, quantity: number) => ({
        productId,
        productName: productId,
        quantity,
        unitPriceCents: 100,
      })
      const { service } = makeService(
        [sale('2026-09-13T12:00:00.000Z', 0, 'CASH', 'op1', 'Karol', [item('barely-sold', 2), item('sold-a-lot', 20)])],
        {
          findActiveProducts: jest.fn().mockResolvedValue([
            { id: 'barely-sold', name: 'Vendeu pouco', photoUrl: null },
            { id: 'sold-a-lot', name: 'Vendeu muito', photoUrl: null },
          ]),
        },
      )
      const summary = await service.summary('t1', today, now)
      expect(summary.stagnantProducts.map((p) => p.productId)).toEqual(['barely-sold'])
    })
  })
})
