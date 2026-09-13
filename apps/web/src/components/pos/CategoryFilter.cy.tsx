import { useState } from 'react'
import { CategoryFilter } from './CategoryFilter'

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <CategoryFilter categories={['Bebidas', 'Hortifruti']} value={value} onChange={setValue} />
}

describe('CategoryFilter', () => {
  it('starts on "Todas" and selects one category at a time', () => {
    cy.mount(<Harness />)
    cy.contains('button', 'Todas').should('have.attr', 'aria-checked', 'true')
    cy.contains('button', 'Bebidas').click()
    cy.contains('button', 'Bebidas').should('have.attr', 'aria-checked', 'true')
    cy.contains('button', 'Todas').should('have.attr', 'aria-checked', 'false')
  })

  it('reports null when "Todas" is picked again', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<CategoryFilter categories={['Bebidas']} value="Bebidas" onChange={onChange} />)
    cy.contains('button', 'Todas').click()
    cy.get('@onChange').should('have.been.calledWith', null)
  })
})
