import { useState } from 'react'
import { Combobox } from './Combobox'

const options = ['Bebidas', 'Estiva', 'Higiene', 'Limpeza']

function Harness() {
  const [value, setValue] = useState('')
  return (
    <Combobox label="Categoria" required value={value} onChange={setValue} options={options} hint="Escolha ou digite" />
  )
}

describe('Combobox', () => {
  it('filters while typing and selects with a click', () => {
    cy.mount(<Harness />)
    cy.contains('label', 'Categoria').should('contain', '*')
    cy.contains('Escolha ou digite')
    cy.get('input[role=combobox]').type('li')
    cy.get('[role=option]').should('have.length', 1).and('contain', 'Limpeza').click()
    cy.get('input[role=combobox]').should('have.value', 'Limpeza')
  })

  it('selects with the keyboard and keeps free text', () => {
    cy.mount(<Harness />)
    cy.get('input[role=combobox]').type('e{downarrow}{enter}')
    cy.get('input[role=combobox]').invoke('val').should('be.oneOf', options)
    cy.get('input[role=combobox]').clear().type('Artesanato{esc}')
    cy.get('input[role=combobox]').should('have.value', 'Artesanato')
    cy.get('[role=listbox]').should('not.exist')
  })

  it('limits typing to maxLength and shows a right-aligned counter', () => {
    function LimitedHarness() {
      const [value, setValue] = useState('')
      return <Combobox label="Categoria" value={value} onChange={setValue} options={options} maxLength={6} />
    }
    cy.mount(<LimitedHarness />)
    cy.contains('0/6')
    cy.get('input[role=combobox]').type('Artesanato')
    cy.get('input[role=combobox]').should('have.value', 'Artesa')
    cy.contains('6/6')
  })
})
