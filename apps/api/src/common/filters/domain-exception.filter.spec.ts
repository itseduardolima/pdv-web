import { createSaleSchema } from '@pdv/shared'
import { validationDetails } from './domain-exception.filter'

describe('validationDetails', () => {
  const base = {
    uuid: '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'CASH',
  }

  function detailsFor(input: unknown) {
    const result = createSaleSchema.safeParse(input)
    if (result.success) throw new Error('expected a validation error')
    return validationDetails(result.error)
  }

  it('keeps the top-level keys exactly as flatten() gives them', () => {
    const details = detailsFor({ ...base, items: [] })
    expect(details.fieldErrors.items).toEqual(['Adicione ao menos um item ao carrinho'])
  })

  it('adds a dotted key for the exact list item that failed', () => {
    const details = detailsFor({
      ...base,
      partialPayments: [
        { method: 'PIX', amountCents: 1000 },
        { method: '', amountCents: 1000 },
        { method: '', amountCents: 0 },
      ],
    })
    expect(details.fieldErrors['partialPayments.1.method']).toEqual(['Escolha a forma de pagamento'])
    expect(details.fieldErrors['partialPayments.2.method']).toEqual(['Escolha a forma de pagamento'])
    expect(details.fieldErrors['partialPayments.2.amountCents']).toEqual(['O valor deve ser maior que zero'])
    expect(details.fieldErrors['partialPayments.0.method']).toBeUndefined()
    // a chave de 1º nível continua existindo (compatibilidade)
    expect(details.fieldErrors.partialPayments).toBeDefined()
  })
})
