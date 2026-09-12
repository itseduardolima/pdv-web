import { WeekChart } from './WeekChart'

const days = [
  { date: '2026-09-06', totalCents: 0, salesCount: 0 },
  { date: '2026-09-07', totalCents: 5000, salesCount: 2 },
  { date: '2026-09-08', totalCents: 10000, salesCount: 4 },
  { date: '2026-09-09', totalCents: 0, salesCount: 0 },
  { date: '2026-09-10', totalCents: 2500, salesCount: 1 },
  { date: '2026-09-11', totalCents: 7500, salesCount: 3 },
  { date: '2026-09-12', totalCents: 20000, salesCount: 9 },
]

describe('WeekChart', () => {
  it('draws one bar per day scaled to the best day, with weekday labels', () => {
    cy.mount(<WeekChart days={days} />)
    cy.get('rect').should('have.length', 7)
    cy.get('[data-cy=week-day]').should('have.length', 7).first().should('contain', 'Dom')
    cy.get('[data-cy=week-day]').last().should('contain', 'Sáb').and('have.class', 'font-bold')
    // hoje é o maior: barra cheia; dia zerado vira traço fino
    cy.get('rect')
      .last()
      .should('have.class', 'fill-primary')
      .invoke('attr', 'height')
      .then(Number)
      .should('be.gt', 130)
    cy.get('rect').first().should('have.class', 'fill-border').invoke('attr', 'height').then(Number).should('be.lt', 5)
  })

  it('renders a flat week without crashing when there are no sales', () => {
    cy.mount(<WeekChart days={days.map((day) => ({ ...day, totalCents: 0, salesCount: 0 }))} />)
    cy.get('rect')
      .should('have.length', 7)
      .each((bar) => expect(Number(bar.attr('height'))).to.be.lt(5))
  })
})
