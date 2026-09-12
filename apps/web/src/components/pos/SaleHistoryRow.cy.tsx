import { SaleHistoryRow } from './SaleHistoryRow'

describe('SaleHistoryRow', () => {
  it('summarizes items, operator, payment method, time and total', () => {
    cy.mount(
      <ul>
        <SaleHistoryRow
          sale={{
            id: 's1',
            uuid: '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab',
            cashSessionId: 'cs1',
            operatorId: 'op1',
            operatorName: 'Karol',
            paymentMethod: 'PIX',
            totalCents: 8340,
            amountReceivedCents: null,
            changeCents: null,
            soldAt: new Date(2026, 8, 12, 16, 42).toISOString(),
            items: [
              { productId: 'p1', productName: 'Arroz', quantity: 3, unitPriceCents: 100 },
              { productId: 'p2', productName: 'Feijão', quantity: 1, unitPriceCents: 100 },
            ],
          }}
        />
      </ul>,
    )
    cy.contains('4 itens · Karol · Pix')
    cy.contains('16:42')
    cy.contains('R$ 83,40')
  })
})
