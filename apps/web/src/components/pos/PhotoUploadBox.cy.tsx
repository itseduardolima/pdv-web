import { PhotoUploadBox } from './PhotoUploadBox'

describe('PhotoUploadBox', () => {
  it('shows the label and emits the chosen file', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<PhotoUploadBox value={null} onChange={onChange} />)
    cy.contains('Adicionar foto')
    cy.get('[data-cy=photo-input]').selectFile({ contents: Cypress.Buffer.from('x'), fileName: 'foto.png', mimeType: 'image/png' }, { force: true })
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
})
