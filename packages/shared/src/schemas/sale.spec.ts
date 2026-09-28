import { createSaleSchema, MAX_SALE_PAYMENTS, voidSaleSchema } from './sale'

const base = {
  uuid: '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab',
  items: [{ productId: 'p1', quantity: 1 }],
  paymentMethod: 'CASH' as const,
}
const part = { method: 'PIX' as const, amountCents: 100 }

describe('createSaleSchema — pagamento misto', () => {
  it('accepts up to MAX_SALE_PAYMENTS - 1 explicit parts (the last method pays the rest)', () => {
    const partialPayments = Array.from({ length: MAX_SALE_PAYMENTS - 1 }, () => part)
    expect(createSaleSchema.safeParse({ ...base, partialPayments }).success).toBe(true)
  })

  it('rejects more than MAX_SALE_PAYMENTS forms in total', () => {
    const partialPayments = Array.from({ length: MAX_SALE_PAYMENTS }, () => part)
    const result = createSaleSchema.safeParse({ ...base, partialPayments })
    expect(result.success).toBe(false)
  })

  it('rejects a part with zero amount', () => {
    expect(createSaleSchema.safeParse({ ...base, partialPayments: [{ ...part, amountCents: 0 }] }).success).toBe(false)
  })
})

describe('voidSaleSchema', () => {
  const reasonError = (reason: string) => {
    const result = voidSaleSchema.safeParse({ reason })
    return result.success ? null : result.error.issues[0]?.message
  }

  it('accepts a reason of 5 to 200 characters, trimmed', () => {
    expect(voidSaleSchema.safeParse({ reason: '  Cliente desistiu  ' })).toMatchObject({
      success: true,
      data: { reason: 'Cliente desistiu' },
    })
    expect(voidSaleSchema.safeParse({ reason: 'a'.repeat(200) }).success).toBe(true)
  })

  it('asks for a reason when empty or only spaces', () => {
    expect(reasonError('')).toBe('Informe o motivo da anulação')
    expect(reasonError('    ')).toBe('Informe o motivo da anulação')
  })

  it('rejects a reason shorter than 5 characters', () => {
    expect(reasonError('ab')).toBe('Descreva o motivo em pelo menos 5 caracteres')
  })

  it('rejects a reason above 200 characters', () => {
    expect(reasonError('a'.repeat(201))).toBe('O motivo pode ter no máximo 200 caracteres')
  })
})
