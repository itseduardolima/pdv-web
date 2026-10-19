import { allocateDiscount, computeDiscount } from './sale-discount'

describe('computeDiscount', () => {
  it('returns no discount when none is informed', () => {
    expect(computeDiscount(1000, undefined)).toEqual({ discountCents: 0, discountType: null, discountValue: null })
  })

  it('uses the amount as-is', () => {
    expect(computeDiscount(1000, { type: 'AMOUNT', value: 250 })).toEqual({
      discountCents: 250,
      discountType: 'AMOUNT',
      discountValue: 250,
    })
  })

  it('computes a percentage in basis points, rounded to whole cents', () => {
    expect(computeDiscount(1000, { type: 'PERCENT', value: 1000 }).discountCents).toBe(100)
    expect(computeDiscount(999, { type: 'PERCENT', value: 1000 }).discountCents).toBe(100)
    expect(computeDiscount(1001, { type: 'PERCENT', value: 750 }).discountCents).toBe(75)
  })

  it('drops a percentage that rounds to zero cents', () => {
    expect(computeDiscount(10, { type: 'PERCENT', value: 1 })).toEqual({
      discountCents: 0,
      discountType: null,
      discountValue: null,
    })
  })

  it('rejects a discount equal to or above the subtotal', () => {
    expect(() => computeDiscount(1000, { type: 'AMOUNT', value: 1000 })).toThrow(
      expect.objectContaining({ code: 'DISCOUNT_TOO_HIGH', statusCode: 400 }),
    )
    expect(() => computeDiscount(1000, { type: 'AMOUNT', value: 5000 })).toThrow(
      expect.objectContaining({ code: 'DISCOUNT_TOO_HIGH' }),
    )
  })

  it('rejects a percentage that rounds up to the whole subtotal', () => {
    expect(() => computeDiscount(1, { type: 'PERCENT', value: 9999 })).toThrow(
      expect.objectContaining({ code: 'DISCOUNT_TOO_HIGH' }),
    )
  })
})

describe('allocateDiscount', () => {
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

  it('splits proportionally when it divides evenly', () => {
    expect(allocateDiscount([1000, 3000], 400)).toEqual([100, 300])
  })

  it('gives the leftover cents to the largest remainders and always sums to the discount', () => {
    const shares = allocateDiscount([100, 100, 100], 100)
    expect(sum(shares)).toBe(100)
    expect(shares).toEqual([34, 33, 33])
  })

  it('breaks remainder ties by position', () => {
    expect(allocateDiscount([100, 100], 1)).toEqual([1, 0])
  })

  it('never discounts a line above its own total', () => {
    const lines = [1, 1, 5000]
    const shares = allocateDiscount(lines, 5001)
    expect(sum(shares)).toBe(5001)
    shares.forEach((share, index) => expect(share).toBeLessThanOrEqual(lines[index] ?? 0))
  })

  it('returns zeros without a discount', () => {
    expect(allocateDiscount([500, 700], 0)).toEqual([0, 0])
  })
})
