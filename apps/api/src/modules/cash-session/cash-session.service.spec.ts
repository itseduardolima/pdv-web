import { CashSessionRepository, type CashSessionRow } from './cash-session.repository'
import { CashSessionService } from './cash-session.service'

const openRow: CashSessionRow = {
  id: 'cs1',
  tenantId: 't1',
  openedById: 'op1',
  openingAmountCents: 15000,
  note: null,
  openedAt: new Date('2026-09-12T08:00:00Z'),
  closedAt: null,
  totalCashCents: null,
  totalCardCents: null,
  totalPixCents: null,
  openedBy: { name: 'Karol' },
}
const operator = { id: 'op1', tenantId: 't1', role: 'OPERATOR' as const }
const otherOperator = { id: 'op2', tenantId: 't1', role: 'OPERATOR' as const }
const admin = { id: 'adm', tenantId: 't1', role: 'ADMIN' as const }

function makeService(overrides: Partial<Record<keyof CashSessionRepository, jest.Mock>> = {}) {
  const repository = {
    findOpen: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    countOpenedUpTo: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue(openRow),
    close: jest
      .fn()
      .mockImplementation(async (_t: string, _id: string, totals: Record<string, number>, closedAt: Date) => ({
        ...openRow,
        closedAt,
        totalCashCents: totals.CASH,
        totalCardCents: totals.CARD,
        totalPixCents: totals.PIX,
      })),
    sumSalesByPaymentMethod: jest
      .fn()
      .mockResolvedValue({ totals: { CASH: 21400, CARD: 17890, PIX: 21950 }, count: 42 }),
    findSales: jest.fn().mockResolvedValue([]),
    ...overrides,
  }
  return { service: new CashSessionService(repository as unknown as CashSessionRepository), repository }
}

describe('CashSessionService', () => {
  describe('getCurrent', () => {
    it('returns null when no session is open', async () => {
      const { service } = makeService()
      await expect(service.getCurrent('t1')).resolves.toBeNull()
    })

    it('returns the open session with live totals, total and sales count', async () => {
      const { service } = makeService({ findOpen: jest.fn().mockResolvedValue(openRow) })
      await expect(service.getCurrent('t1')).resolves.toMatchObject({
        id: 'cs1',
        sequence: 1,
        openedByName: 'Karol',
        closedAt: null,
        totals: { CASH: 21400, CARD: 17890, PIX: 21950 },
        totalCents: 61240,
        salesCount: 42,
      })
    })
  })

  describe('open', () => {
    it('creates the session for the logged operator', async () => {
      const { service, repository } = makeService()
      const result = await service.open('t1', operator, { openingAmountCents: 15000 })
      expect(repository.create).toHaveBeenCalledWith('t1', 'op1', { openingAmountCents: 15000 })
      expect(result.openingAmountCents).toBe(15000)
    })

    it('rejects with 409 CASH_SESSION_ALREADY_OPEN when one is already open in the tenant', async () => {
      const { service, repository } = makeService({ findOpen: jest.fn().mockResolvedValue(openRow) })
      await expect(service.open('t1', otherOperator, { openingAmountCents: 0 })).rejects.toMatchObject({
        code: 'CASH_SESSION_ALREADY_OPEN',
        statusCode: 409,
      })
      expect(repository.create).not.toHaveBeenCalled()
    })
  })

  describe('close', () => {
    it('sums sales by payment method, freezes the totals and sets closedAt', async () => {
      const { service, repository } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      const result = await service.close('t1', 'cs1', operator)
      expect(repository.close).toHaveBeenCalledWith(
        't1',
        'cs1',
        { CASH: 21400, CARD: 17890, PIX: 21950 },
        expect.any(Date),
      )
      expect(result.closedAt).not.toBeNull()
      expect(result.totalCashCents).toBe(21400)
      expect(result.totalCents).toBe(61240)
    })

    it('throws 404 for an unknown session', async () => {
      const { service } = makeService()
      await expect(service.close('t1', 'nope', operator)).rejects.toMatchObject({ code: 'CASH_SESSION_NOT_FOUND' })
    })

    it('rejects closing an already closed session (immutable)', async () => {
      const { service, repository } = makeService({
        findById: jest.fn().mockResolvedValue({
          ...openRow,
          closedAt: new Date(),
          totalCashCents: 1,
          totalCardCents: 2,
          totalPixCents: 3,
        }),
      })
      await expect(service.close('t1', 'cs1', admin)).rejects.toMatchObject({
        code: 'CASH_SESSION_ALREADY_CLOSED',
        statusCode: 409,
      })
      expect(repository.close).not.toHaveBeenCalled()
    })

    it('forbids an operator from closing a session opened by someone else', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.close('t1', 'cs1', otherOperator)).rejects.toMatchObject({
        code: 'NOT_CASH_SESSION_OWNER',
        statusCode: 403,
      })
    })

    it('lets an admin close any session', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.close('t1', 'cs1', admin)).resolves.toBeDefined()
    })

    it('a closed session reports the frozen totals, not live sums', async () => {
      const { service } = makeService({
        findById: jest.fn().mockResolvedValue({
          ...openRow,
          closedAt: new Date(),
          totalCashCents: 100,
          totalCardCents: 200,
          totalPixCents: 300,
        }),
      })
      await expect(service.get('t1', 'cs1')).resolves.toMatchObject({
        totals: { CASH: 100, CARD: 200, PIX: 300 },
        totalCents: 600,
      })
    })
  })

  describe('listSales', () => {
    it('maps sales with operator name and items', async () => {
      const { service } = makeService({
        findById: jest.fn().mockResolvedValue(openRow),
        findSales: jest.fn().mockResolvedValue([
          {
            id: 's1',
            uuid: '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab',
            tenantId: 't1',
            cashSessionId: 'cs1',
            operatorId: 'op1',
            paymentMethod: 'PIX',
            totalCents: 8340,
            soldAt: new Date('2026-09-12T16:42:00Z'),
            operator: { name: 'Karol' },
            items: [
              { id: 'i1', saleId: 's1', productId: 'p1', productName: 'Arroz 5kg', quantity: 2, unitPriceCents: 2890 },
            ],
          },
        ]),
      })
      const sales = await service.listSales('t1', 'cs1')
      expect(sales[0]).toMatchObject({ operatorName: 'Karol', paymentMethod: 'PIX', totalCents: 8340 })
      expect(sales[0]?.items[0]).toEqual({
        productId: 'p1',
        productName: 'Arroz 5kg',
        quantity: 2,
        unitPriceCents: 2890,
      })
    })

    it('throws 404 for a session of another tenant', async () => {
      const { service } = makeService()
      await expect(service.listSales('t1', 'cs1')).rejects.toMatchObject({ code: 'CASH_SESSION_NOT_FOUND' })
    })
  })
})
