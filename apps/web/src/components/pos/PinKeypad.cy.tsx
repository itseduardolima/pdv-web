import { usePinInput } from '@/hooks/use-pin-input'
import { PinKeypad } from './PinKeypad'

// Harness mínimo: o hook compartilhado alimenta o componente, como na tela de Login.
function Harness() {
  const input = usePinInput()
  return <PinKeypad pin={input.pin} onDigit={input.append} onBackspace={input.backspace} onClear={input.clear} />
}

describe('PinKeypad', () => {
  it('composes digits, stops at 4, backspaces and clears', () => {
    cy.mount(<Harness />)

    for (const digit of ['1', '2', '3', '4', '5']) cy.contains('button', digit).click()
    cy.get('[data-cy=pin-dots] [data-filled=true]').should('have.length', 4)

    cy.get('button[aria-label=Apagar]').click()
    cy.get('[data-cy=pin-dots] [data-filled=true]').should('have.length', 3)

    cy.contains('button', 'Limpar').click()
    cy.get('[data-cy=pin-dots] [data-filled=true]').should('have.length', 0)
  })

  it('disables every key while submitting', () => {
    cy.mount(<PinKeypad pin="" onDigit={() => {}} onBackspace={() => {}} onClear={() => {}} disabled />)
    cy.get('button').each(($button) => expect($button).to.be.disabled)
  })
})
