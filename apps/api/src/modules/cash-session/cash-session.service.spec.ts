import { CashSessionRepository, RegisterAlreadyOpenError, type CashSessionRow } from './cash-session.repository'
import { CashSessionService } from './cash-session.service'

const openRow: CashSessionRow = {
  id: 'cs1',
  tenantId: 't1',
  registerNumber: 1,
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
    findOpenByOperator: jest.fn().mockResolvedValue(null),
    findOpenByRegister: jest.fn().mockResolvedValue(null),
    findAllOpen: jest.fn().mockResolvedValue([]),
    findRegisterCount: jest.fn().mockResolvedValue({ registerCount: 1 }),
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
    it('returns null when no session is open in the tenant', async () => {
      const { service } = makeService()
      await expect(service.getCurrent('t1')).resolves.toBeNull()
    })

    // "A loja está operando hoje": qualquer sessão aberta no tenant conta,
    // não importa quem abriu — é o que guarda o acesso a Vender/Produtos/
    // Fechamento/Dashboard/Operadores (HU 4.2), distinto de getMine (HU 4.7).
    it('returns any open session in the tenant, regardless of who opened it', async () => {
      const { service, repository } = makeService({ findOpen: jest.fn().mockResolvedValue(openRow) })
      await expect(service.getCurrent('t1')).resolves.toMatchObject({
        id: 'cs1',
        sequence: 1,
        openedByName: 'Karol',
        totals: { CASH: 21400, CARD: 17890, PIX: 21950 },
        totalCents: 61240,
        salesCount: 42,
      })
      expect(repository.findOpen).toHaveBeenCalledWith('t1')
    })
  })

  describe('getMine', () => {
    it('returns null when this operator has no session open, even if another operator does', async () => {
      const { service, repository } = makeService()
      await expect(service.getMine('t1', 'op2')).resolves.toBeNull()
      expect(repository.findOpenByOperator).toHaveBeenCalledWith('t1', 'op2')
    })

    it('returns the session opened by this operator, with live totals, total and sales count (HU 4.7)', async () => {
      const { service } = makeService({ findOpenByOperator: jest.fn().mockResolvedValue(openRow) })
      await expect(service.getMine('t1', 'op1')).resolves.toMatchObject({
        id: 'cs1',
        registerNumber: 1,
        openedByName: 'Karol',
        totalCents: 61240,
        salesCount: 42,
      })
    })
  })

  describe('requireOpen', () => {
    it("returns the operator's own open session", async () => {
      const { service } = makeService({ findOpenByOperator: jest.fn().mockResolvedValue(openRow) })
      await expect(service.requireOpen('t1', 'op1')).resolves.toMatchObject({ id: 'cs1' })
    })

    it('throws 409 CASH_SESSION_NOT_OPEN when this operator has none open (even if another operator does)', async () => {
      const { service } = makeService()
      await expect(service.requireOpen('t1', 'op1')).rejects.toMatchObject({
        code: 'CASH_SESSION_NOT_OPEN',
        statusCode: 409,
      })
    })
  })

  describe('open', () => {
    it('creates the session for the logged operator, defaulting to register 1', async () => {
      const { service, repository } = makeService()
      const result = await service.open('t1', operator, { openingAmountCents: 15000 })
      expect(repository.create).toHaveBeenCalledWith('t1', 'op1', 1, { openingAmountCents: 15000 })
      expect(result.openingAmountCents).toBe(15000)
      expect(result.registerNumber).toBe(1)
    })

    it('rejects with 409 CASH_SESSION_ALREADY_OPEN when that register already has an open session', async () => {
      const { service, repository } = makeService({ findOpenByRegister: jest.fn().mockResolvedValue(openRow) })
      await expect(service.open('t1', otherOperator, { openingAmountCents: 0 })).rejects.toMatchObject({
        code: 'CASH_SESSION_ALREADY_OPEN',
        statusCode: 409,
        details: { registerNumber: 1 },
      })
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('allows opening different registers of the same tenant at the same time (HU 4.5)', async () => {
      const { service, repository } = makeService({
        findRegisterCount: jest.fn().mockResolvedValue({ registerCount: 2 }),
        // register 1 already open; register 2 is free
        findOpenByRegister: jest.fn().mockImplementation((_t: string, n: number) => (n === 1 ? openRow : null)),
        create: jest.fn().mockResolvedValue({ ...openRow, id: 'cs2', registerNumber: 2, openedById: 'op2' }),
      })
      const result = await service.open('t1', otherOperator, { openingAmountCents: 5000, registerNumber: 2 })
      expect(repository.create).toHaveBeenCalledWith('t1', 'op2', 2, { openingAmountCents: 5000, registerNumber: 2 })
      expect(result.registerNumber).toBe(2)
    })

    it('rejects a registerNumber above tenant.registerCount with 400 VALIDATION', async () => {
      const { service, repository } = makeService({
        findRegisterCount: jest.fn().mockResolvedValue({ registerCount: 1 }),
      })
      await expect(service.open('t1', operator, { openingAmountCents: 0, registerNumber: 2 })).rejects.toMatchObject({
        code: 'VALIDATION',
        statusCode: 400,
      })
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('converts a concurrent double-open (DB unique index race) into a clean 409, not a raw error', async () => {
      const { service } = makeService({
        create: jest.fn().mockRejectedValue(new RegisterAlreadyOpenError()),
      })
      await expect(service.open('t1', operator, { openingAmountCents: 0 })).rejects.toMatchObject({
        code: 'CASH_SESSION_ALREADY_OPEN',
        statusCode: 409,
        details: { registerNumber: 1 },
      })
    })
  })

  describe('listRegisters', () => {
    it('reports every register as free when tenant has multiple and none is open', async () => {
      const { service } = makeService({ findRegisterCount: jest.fn().mockResolvedValue({ registerCount: 3 }) })
      await expect(service.listRegisters('t1')).resolves.toEqual([
        { registerNumber: 1, sessionId: null, openedById: null, openedByName: null, openedAt: null },
        { registerNumber: 2, sessionId: null, openedById: null, openedByName: null, openedAt: null },
        { registerNumber: 3, sessionId: null, openedById: null, openedByName: null, openedAt: null },
      ])
    })

    it('marks the register with an open session as taken, by whom and since when', async () => {
      const { service } = makeService({
        findRegisterCount: jest.fn().mockResolvedValue({ registerCount: 2 }),
        findAllOpen: jest.fn().mockResolvedValue([openRow]),
      })
      const registers = await service.listRegisters('t1')
      expect(registers).toEqual([
        {
          registerNumber: 1,
          sessionId: 'cs1',
          openedById: 'op1',
          openedByName: 'Karol',
          openedAt: openRow.openedAt.toISOString(),
        },
        { registerNumber: 2, sessionId: null, openedById: null, openedByName: null, openedAt: null },
      ])
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
      await expect(service.get('t1', 'cs1', operator)).resolves.toMatchObject({
        totals: { CASH: 100, CARD: 200, PIX: 300 },
        totalCents: 600,
      })
    })
  })

  describe('get', () => {
    it('forbids an operator from viewing a session opened by someone else (HU 4.7)', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.get('t1', 'cs1', otherOperator)).rejects.toMatchObject({
        code: 'NOT_CASH_SESSION_OWNER',
        statusCode: 403,
      })
    })

    it('lets an admin view any session', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.get('t1', 'cs1', admin)).resolves.toBeDefined()
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
      const sales = await service.listSales('t1', 'cs1', operator)
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
      await expect(service.listSales('t1', 'cs1', operator)).rejects.toMatchObject({ code: 'CASH_SESSION_NOT_FOUND' })
    })

    it('forbids an operator from viewing the sales of a session opened by someone else (HU 4.7)', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.listSales('t1', 'cs1', otherOperator)).rejects.toMatchObject({
        code: 'NOT_CASH_SESSION_OWNER',
        statusCode: 403,
      })
    })

    it('lets an admin view the sales of any session', async () => {
      const { service } = makeService({ findById: jest.fn().mockResolvedValue(openRow) })
      await expect(service.listSales('t1', 'cs1', admin)).resolves.toEqual([])
    })
  })
})
