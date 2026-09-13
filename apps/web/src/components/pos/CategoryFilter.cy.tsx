import { useState } from 'react'
import { CategoryFilter } from './CategoryFilter'

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <CategoryFilter categories={['Bebidas', 'Hortifruti']} value={value} onChange={setValue} />
}

describe('CategoryFilter — chips (abaixo de xl)', () => {
  it('starts on "Todas" and selects one category at a time', () => {
    cy.mount(<Harness />)
    cy.get('[role=radiogroup]').within(() => {
      cy.contains('button', 'Todas').should('have.attr', 'aria-checked', 'true')
      cy.contains('button', 'Bebidas').click()
      cy.contains('button', 'Bebidas').should('have.attr', 'aria-checked', 'true')
      cy.contains('button', 'Todas').should('have.attr', 'aria-checked', 'false')
    })
  })

  it('reports null when "Todas" is picked again', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<CategoryFilter categories={['Bebidas']} value="Bebidas" onChange={onChange} />)
    cy.get('[role=radiogroup]').contains('button', 'Todas').click()
    cy.get('@onChange').should('have.been.calledWith', null)
  })
})

describe('CategoryFilter — select (xl, desktop)', () => {
  it('shows the current category and lets a new one be picked', () => {
    cy.viewport(1280, 800)
    cy.mount(<Harness />)
    cy.get('button[aria-label="Filtrar por categoria"]').should('be.visible').and('contain', 'Todas').click()
    cy.get('[role=option]').contains('Hortifruti').click()
    cy.get('button[aria-label="Filtrar por categoria"]').should('contain', 'Hortifruti')
  })

  it('reports null when "Todas" is picked again', () => {
    cy.viewport(1280, 800)
    const onChange = cy.stub().as('onChange')
    cy.mount(<CategoryFilter categories={['Bebidas']} value="Bebidas" onChange={onChange} />)
    cy.get('button[aria-label="Filtrar por categoria"]').click()
    cy.get('[role=option]').contains('Todas').click()
    cy.get('@onChange').should('have.been.calledWith', null)
  })
})
