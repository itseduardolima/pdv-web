import { useState } from 'react'
import type { DiscountType } from '@pdv/shared'
import { DiscountField } from './DiscountField'

function Harness({ error }: { error?: string }) {
  const [type, setType] = useState<DiscountType>('AMOUNT')
  const [value, setValue] = useState('')
  return (
    <DiscountField
      type={type}
      value={value}
      onTypeChange={(next) => {
        setType(next)
        setValue('')
      }}
      onValueChange={(text) => {
        setValue(text)
      }}
      error={error}
    />
  )
}

describe('DiscountField', () => {
  it('masks the amount like money while typing', () => {
    cy.mount(<Harness />)
    cy.get('input[name=discount]').type('250')
    cy.get('input[name=discount]').should('have.value', '2,50')
  })

  it('switches to percent, clearing the text and accepting a decimal', () => {
    cy.mount(<Harness />)
    cy.get('input[name=discount]').type('250')
    cy.contains('button', '%').click()
    cy.get('input[name=discount]').should('have.value', '')
    cy.get('input[name=discount]').type('7,5')
    cy.get('input[name=discount]').should('have.value', '7,5')
    cy.contains('button', '%').should('have.attr', 'aria-pressed', 'true')
  })

  it('shows the error coming from the API', () => {
    cy.mount(<Harness error="O desconto deve ser menor que o total da venda." />)
    cy.contains('O desconto deve ser menor que o total da venda.').should('be.visible')
  })

  it('offers to remove the discount only when asked to', () => {
    const onRemove = cy.stub().as('onRemove')
    cy.mount(<DiscountField type="AMOUNT" value="" onTypeChange={() => {}} onValueChange={() => {}} />)
    cy.get('[data-cy=discount-remove]').should('not.exist')
    cy.mount(
      <DiscountField type="AMOUNT" value="" onTypeChange={() => {}} onValueChange={() => {}} onRemove={onRemove} />,
    )
    cy.get('[data-cy=discount-remove]').click()
    cy.get('@onRemove').should('have.been.calledOnce')
  })
})
