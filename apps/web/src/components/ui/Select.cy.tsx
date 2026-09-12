import { useState } from 'react'
import { Select } from './Select'

const options = [
  { value: 'UN', label: 'Un (unidade)' },
  { value: 'KG', label: 'Kg (quilo)' },
]

function Harness() {
  const [value, setValue] = useState('')
  return <Select label="Unidade" required options={options} value={value} onChange={setValue} placeholder="Selecione" />
}

describe('Select', () => {
  it('shows the placeholder, opens a custom-styled menu and emits the chosen option', () => {
    cy.mount(<Harness />)
    cy.contains('label', 'Unidade').should('contain', '*')
    cy.get('button[role=combobox]').should('contain', 'Selecione')

    cy.get('[role=listbox]').should('not.exist')
    cy.contains('label', 'Unidade').click()
    cy.get('[role=listbox]').should('be.visible')
    cy.get('[role=option]').should('have.length', 2)

    cy.contains('[role=option]', 'Kg (quilo)').click()
    cy.get('button[role=combobox]').should('contain', 'Kg (quilo)')
    cy.get('[role=listbox]').should('not.exist')
  })

  it('shows the API field error and marks the trigger invalid', () => {
    cy.mount(<Select label="Unidade" options={options} error="Escolha uma unidade" />)
    cy.get('button[role=combobox]').should('have.attr', 'aria-invalid', 'true')
    cy.get('[role=alert]').should('have.text', 'Escolha uma unidade')
  })

  it('renders a hint when there is no error', () => {
    cy.mount(<Select label="Unidade" options={options} hint="Como o produto é vendido" />)
    cy.contains('Como o produto é vendido')
    cy.get('[role=alert]').should('not.exist')
  })
})
