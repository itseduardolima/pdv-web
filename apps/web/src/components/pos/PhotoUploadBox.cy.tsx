import { PhotoUploadBox } from './PhotoUploadBox'

describe('PhotoUploadBox', () => {
  it('shows the label and emits the chosen file', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<PhotoUploadBox value={null} onChange={onChange} />)
    cy.contains('Adicionar foto')
    cy.get('[data-cy=photo-input]').selectFile(
      { contents: Cypress.Buffer.from('x'), fileName: 'foto.png', mimeType: 'image/png' },
      { force: true },
    )
    cy.get('@onChange').should('have.been.calledOnce')
  })

  it('previews the current photo and offers to replace it', () => {
    cy.mount(<PhotoUploadBox value="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onChange={() => {}} />)
    cy.get('img').should('exist')
    cy.contains('Trocar foto')
  })

  it('shows the API error below the box', () => {
    cy.mount(<PhotoUploadBox value={null} onChange={() => {}} error="A imagem deve ter no máximo 5 MB" />)
    cy.get('[role=alert]').should('have.text', 'A imagem deve ter no máximo 5 MB')
  })

  it('renders the box itself as a circle for the operator variant, not just the photo', () => {
    cy.mount(<PhotoUploadBox value="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onChange={() => {}} variant="round" />)
    cy.get('button').should('have.class', 'rounded-pill').and('not.have.class', 'bg-canvas')
    cy.get('img').should('have.class', 'rounded-pill')
  })

  it('drops the gray background once there is a photo', () => {
    cy.mount(<PhotoUploadBox value={null} onChange={() => {}} />)
    cy.get('button').should('have.class', 'bg-canvas')
    cy.mount(<PhotoUploadBox value="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onChange={() => {}} />)
    cy.get('button').should('not.have.class', 'bg-canvas')
  })
})
