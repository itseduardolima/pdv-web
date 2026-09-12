import { InlineAlert } from './InlineAlert'

describe('InlineAlert', () => {
  it('renders the message with role=alert', () => {
    cy.mount(<InlineAlert>Estoque insuficiente</InlineAlert>)
    cy.get('[role=alert]').should('contain', 'Estoque insuficiente')
  })

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = cy.stub().as('onDismiss')
    cy.mount(<InlineAlert onDismiss={onDismiss}>x</InlineAlert>)
    cy.get('button[aria-label="Fechar aviso"]').click()
    cy.get('@onDismiss').should('have.been.calledOnce')
  })

  it('renders an action button that runs its own handler, separate from dismiss', () => {
    const onClick = cy.stub().as('onClick')
    const onDismiss = cy.stub().as('onDismiss')
    cy.mount(
      <InlineAlert action={{ label: 'Ajustar estoque', onClick }} onDismiss={onDismiss}>
        &quot;Arroz&quot; está sem estoque.
      </InlineAlert>,
    )
    cy.contains('button', 'Ajustar estoque').click()
    cy.get('@onClick').should('have.been.calledOnce')
    cy.get('@onDismiss').should('not.have.been.called')
  })
})
