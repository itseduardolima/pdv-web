import { useState } from 'react'
import { ColorGradientPicker } from './ColorGradientPicker'

function Harness() {
  const [value, setValue] = useState('#e6e51e')
  return (
    <div>
      <p data-cy="value">{value}</p>
      <ColorGradientPicker value={value} onChange={setValue} />
    </div>
  )
}

describe('ColorGradientPicker', () => {
  it('drags on the saturation/brightness square and updates the hex value', () => {
    cy.mount(<Harness />)
    cy.get('[data-cy=value]').invoke('text').as('before')

    cy.get('[aria-label="Saturação e brilho da cor"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el)
        .trigger('pointerdown', { clientX: rect.left + 5, clientY: rect.top + 5, buttons: 1, pointerId: 1 })
        .trigger('pointermove', { clientX: rect.right - 5, clientY: rect.bottom - 5, buttons: 1, pointerId: 1 })
    })

    cy.get('@before').then((before) => {
      cy.get('[data-cy=value]').invoke('text').should('not.eq', before)
    })
  })

  it('drags on the hue strip and updates the hex value', () => {
    cy.mount(<Harness />)
    cy.get('[data-cy=value]').invoke('text').as('before')

    cy.get('[aria-label="Matiz da cor"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el)
        .trigger('pointerdown', { clientX: rect.left + 2, clientY: rect.top + 1, buttons: 1, pointerId: 1 })
        .trigger('pointermove', { clientX: rect.right - 2, clientY: rect.top + 1, buttons: 1, pointerId: 1 })
    })

    cy.get('@before').then((before) => {
      cy.get('[data-cy=value]').invoke('text').should('not.eq', before)
    })
  })

  it('moves the hue thumb with arrow keys', () => {
    cy.mount(<Harness />)
    cy.get('[aria-label="Matiz da cor"]').should('have.attr', 'aria-valuenow').as('before')

    cy.get('[aria-label="Matiz da cor"]').focus().trigger('keydown', { key: 'ArrowRight' })

    cy.get('@before').then((before) => {
      cy.get('[aria-label="Matiz da cor"]').should('not.have.attr', 'aria-valuenow', before)
    })
  })
})
