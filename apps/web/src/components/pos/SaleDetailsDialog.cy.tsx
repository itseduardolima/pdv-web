import { SaleDetailsDialog } from './SaleDetailsDialog'

const sale = {
  id: 's1',
  uuid: '8f0e1a3c-4c5b-4d6e-8f70-0123456789ab',
  cashSessionId: 'cs1',
  operatorId: 'op1',
  operatorName: 'Karol',
  paymentMethod: 'PIX' as const,
  payments: [{ method: 'PIX' as const, amountCents: 500 }],
  totalCents: 500,
  amountReceivedCents: null,
  changeCents: null,
  soldAt: new Date(2026, 8, 12, 16, 42).toISOString(),
  voidable: true,
  voidedAt: null as string | null,
  voidReason: null as string | null,
  items: [{ productId: 'p1', productName: 'Arroz', quantity: 1, unitPriceCents: 500 }],
}

describe('SaleDetailsDialog — anular venda', () => {
  it('asks for the reason and emits it on confirm', () => {
    const onVoid = cy.stub().as('onVoid')
    cy.mount(<SaleDetailsDialog sale={sale} onOpenChange={() => {}} canVoid onVoid={onVoid} />)
    cy.contains('button', 'Anular venda').click()
    cy.get('input[name=voidReason]').type('Cliente desistiu')
    cy.contains('button', 'Confirmar anulação').click()
    cy.get('@onVoid').should('have.been.calledWith', sale, 'Cliente desistiu')
  })

  it('shows the API error under the reason field', () => {
    cy.mount(
      <SaleDetailsDialog
        sale={sale}
        onOpenChange={() => {}}
        canVoid
        onVoid={() => {}}
        voidError="Informe o motivo da anulação"
      />,
    )
    cy.contains('button', 'Anular venda').click()
    cy.get('[role=alert]').should('contain', 'Informe o motivo da anulação')
  })

  it('hides the action for non-admins and for sales the API says are not voidable', () => {
    cy.mount(<SaleDetailsDialog sale={sale} onOpenChange={() => {}} canVoid={false} onVoid={() => {}} />)
    cy.contains('button', 'Anular venda').should('not.exist')
    cy.mount(
      <SaleDetailsDialog sale={{ ...sale, voidable: false }} onOpenChange={() => {}} canVoid onVoid={() => {}} />,
    )
    cy.contains('button', 'Anular venda').should('not.exist')
  })

  it('shows the voided banner with the reason', () => {
    const voided = { ...sale, voidable: false, voidedAt: new Date().toISOString(), voidReason: 'Erro de digitação' }
    cy.mount(<SaleDetailsDialog sale={voided} onOpenChange={() => {}} canVoid onVoid={() => {}} />)
    cy.get('[data-cy=sale-voided]').should('contain', 'Venda anulada').and('contain', 'Erro de digitação')
  })
})
