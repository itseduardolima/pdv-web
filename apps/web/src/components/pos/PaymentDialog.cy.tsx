import { PaymentDialog } from './PaymentDialog'

describe('PaymentDialog', () => {
  it('shows the total, the content, and emits confirm / close', () => {
    const onConfirm = cy.stub().as('onConfirm')
    const onOpenChange = cy.stub().as('onOpenChange')
    cy.mount(
      <PaymentDialog open onOpenChange={onOpenChange} totalCents={29194} onConfirm={onConfirm}>
        <p>conteúdo do pagamento</p>
      </PaymentDialog>,
    )
    cy.get('[data-cy=payment-dialog]').should('contain', 'Pagamento').and('contain', 'conteúdo do pagamento')
    cy.get('[data-cy=payment-dialog] header')
      .invoke('text')
      .should('match', /R\$\s291,94/)
    cy.contains('button', 'Finalizar Venda').click()
    cy.get('@onConfirm').should('have.been.calledOnce')
    cy.contains('button', 'Voltar').click()
    cy.get('@onOpenChange').should('have.been.calledWith', false)
  })

  it('keeps the buttons on screen while a long body scrolls inside', () => {
    cy.viewport(800, 500)
    cy.mount(
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}}>
        <div style={{ height: 3000, flexShrink: 0 }}>corpo bem alto</div>
      </PaymentDialog>,
    )
    cy.contains('button', 'Finalizar Venda').then(($button) => {
      expect($button[0].getBoundingClientRect().bottom).to.be.at.most(500)
    })
  })

  it('blocks going back while the sale is being submitted', () => {
    cy.mount(
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}} confirmState="loading">
        <p>x</p>
      </PaymentDialog>,
    )
    cy.contains('button', 'Voltar').should('be.disabled')
  })

  it('on mobile hugs its content (bottom sheet) instead of stretching to the whole screen', () => {
    cy.viewport(390, 844)
    cy.mount(
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}}>
        <p>pouco conteúdo</p>
      </PaymentDialog>,
    )
    cy.get('[data-cy=payment-dialog]').then(($dialog) => {
      const rect = $dialog[0]!.getBoundingClientRect()
      expect(rect.height).to.be.lessThan(400)
      expect(rect.bottom).to.be.closeTo(844, 1)
    })
  })

  it('on mobile a tall body scrolls inside without pushing the buttons off screen', () => {
    cy.viewport(390, 700)
    cy.mount(
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}}>
        <div style={{ height: 3000, flexShrink: 0 }}>corpo bem alto</div>
      </PaymentDialog>,
    )
    cy.get('[data-cy=payment-dialog]').then(($dialog) => {
      expect($dialog[0]!.getBoundingClientRect().height).to.be.at.most(700 * 0.92 + 1)
    })
    cy.contains('button', 'Finalizar Venda').then(($button) => {
      expect($button[0]!.getBoundingClientRect().bottom).to.be.at.most(700)
    })
  })

  it('scrolls to the alert on its own when alertKey changes (the error is born below the fold)', () => {
    cy.viewport(1000, 500)
    const Harness = ({ alertKey }: { alertKey?: string }) => (
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}} alertKey={alertKey}>
        <div style={{ height: 1500, flexShrink: 0 }}>corpo bem alto</div>
        <p role="alert">Estoque insuficiente</p>
      </PaymentDialog>
    )
    const body = () => cy.get('[data-cy=payment-dialog] div.overflow-y-auto')
    cy.mount(<Harness />).then(({ rerender }) => {
      body().should(($body) => {
        expect($body[0]!.scrollHeight).to.be.greaterThan($body[0]!.clientHeight) // há o que rolar
        expect($body[0]!.scrollTop).to.eq(0) // e começa no topo
      })
      // o modal já está aberto quando o erro chega (é o caso real)
      rerender(<Harness alertKey="123|false" />)
    })
    body().should(($body) => expect($body[0]!.scrollTop).to.be.greaterThan(0))
    cy.contains('[role=alert]', 'Estoque insuficiente').should(($alert) => {
      const rect = $alert[0]!.getBoundingClientRect()
      expect(rect.top).to.be.greaterThan(0)
      expect(rect.bottom).to.be.at.most(500)
    })
  })

  it('does not scroll when there is no alert', () => {
    cy.viewport(1000, 500)
    cy.mount(
      <PaymentDialog open onOpenChange={() => {}} totalCents={100} onConfirm={() => {}}>
        <div data-cy="top">topo</div>
        <div style={{ height: 1500, flexShrink: 0 }}>corpo bem alto</div>
      </PaymentDialog>,
    )
    cy.get('[data-cy=top]').should(($top) => {
      expect($top[0]!.getBoundingClientRect().top).to.be.greaterThan(0)
    })
  })
})
