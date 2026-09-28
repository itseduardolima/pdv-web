import { SplitPayment } from './SplitPayment'

const noop = () => {}
const handlers = {
  onPartMethodChange: noop,
  onPartAmountChange: noop,
  onAddPart: noop,
  onRemovePart: noop,
  onLastMethodChange: noop,
  onSplitEqually: noop,
}

describe('SplitPayment', () => {
  it('shows the remainder for the last payment and lets it repeat a method (2 cards)', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        parts={[{ method: 'CARD', amountText: '30,00' }]}
        lastMethod={null}
        remainderCents={2000}
      />,
    )
    cy.get('[data-cy=split-remainder]')
      .invoke('text')
      .should('match', /R\$\s20,00/)
    cy.contains('h3', '1º pagamento')
    cy.contains('h3', '2º pagamento · o resto')
    cy.get('[aria-label="2º pagamento"] [role=radio]').should('have.length', 3)
  })

  it('emits the masked amount typed in a part and which part it was', () => {
    const onPartAmountChange = cy.stub().as('onPartAmountChange')
    cy.mount(
      <SplitPayment
        {...handlers}
        onPartAmountChange={onPartAmountChange}
        parts={[
          { method: 'PIX', amountText: '' },
          { method: 'CARD', amountText: '' },
        ]}
        lastMethod="CASH"
        remainderCents={NaN}
      />,
    )
    cy.get('[data-cy=split-remainder]').should('contain', '—')
    cy.contains('h3', '3º pagamento · o resto')
    cy.get('input[name=partAmount-1]').type('1500')
    cy.get('@onPartAmountChange').should('have.been.calledWith', 1, '0,01')
  })

  it('offers add/remove of parts and stops adding at the limit', () => {
    const onAddPart = cy.stub().as('onAddPart')
    const onRemovePart = cy.stub().as('onRemovePart')
    const parts = [
      { method: 'PIX' as const, amountText: '10,00' },
      { method: 'CARD' as const, amountText: '10,00' },
    ]
    cy.mount(
      <SplitPayment
        {...handlers}
        onAddPart={onAddPart}
        onRemovePart={onRemovePart}
        parts={parts}
        lastMethod="CASH"
        remainderCents={500}
      />,
    )
    cy.contains('button', '+ Adicionar forma').click()
    cy.get('@onAddPart').should('have.been.calledOnce')
    cy.get('[aria-label="Remover 2º pagamento"]').click()
    cy.get('@onRemovePart').should('have.been.calledWith', 1)

    cy.mount(<SplitPayment {...handlers} parts={[...parts, ...parts]} lastMethod="CASH" remainderCents={500} />)
    cy.contains('button', '+ Adicionar forma').should('not.exist')
  })

  it('does not offer Remover when there is a single part', () => {
    cy.mount(
      <SplitPayment {...handlers} parts={[{ method: null, amountText: '' }]} lastMethod={null} remainderCents={NaN} />,
    )
    cy.contains('button', 'Remover').should('not.exist')
  })

  it('emits how many people the total should be split between', () => {
    const onSplitEqually = cy.stub().as('onSplitEqually')
    cy.mount(
      <SplitPayment
        {...handlers}
        onSplitEqually={onSplitEqually}
        parts={[{ method: null, amountText: '' }]}
        lastMethod={null}
        remainderCents={NaN}
      />,
    )
    cy.get('[aria-label="Dividir por 3"]').click()
    cy.get('@onSplitEqually').should('have.been.calledWith', 3)
    cy.get('[aria-label^="Dividir por"]').should('have.length', 4)
  })

  it('paints the remainder as an alert when the parts already cover the total', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        parts={[{ method: 'PIX', amountText: '99,00' }]}
        lastMethod="CASH"
        remainderCents={-100}
      />,
    )
    cy.get('[data-cy=split-remainder] span').should('have.class', 'text-danger')
  })

  it('marks the chosen "dividir igualmente" quantity and only that one', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        evenSplit={3}
        parts={[
          { method: null, amountText: '97,31' },
          { method: null, amountText: '97,31' },
        ]}
        lastMethod={null}
        remainderCents={9732}
      />,
    )
    cy.get('[aria-label="Dividir por 3"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[aria-label="Dividir por 2"]').should('have.attr', 'aria-pressed', 'false')
    cy.get('[aria-label="Dividir por 5"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('shows each part its own error while its method is unselected, and only then', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        parts={[
          { method: null, amountText: '10,00' },
          { method: 'PIX', amountText: '10,00' },
          { method: null, amountText: '10,00' },
        ]}
        lastMethod={null}
        remainderCents={1000}
        partErrors={[
          { method: 'Escolha a forma de pagamento' },
          { method: 'Escolha a forma de pagamento' },
          { method: 'Escolha a forma de pagamento' },
        ]}
        partsError="Escolha a forma de pagamento"
        lastMethodError="Escolha a forma de pagamento"
      />,
    )
    // partes 1 e 3 (sem forma) mostram; a 2 (Pix) não; o resto (sem forma) mostra;
    // o erro geral da lista não repete porque as partes já têm o seu.
    cy.get('[role=alert]').should('have.length', 3)
    cy.get('[aria-label="1º pagamento"]').parent().find('[role=alert]').should('exist')
    cy.get('[aria-label="2º pagamento"]').parent().find('[role=alert]').should('not.exist')
    cy.get('[aria-label="3º pagamento"]').parent().find('[role=alert]').should('exist')
  })

  it('shows the list error when no part has one of its own', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        parts={[{ method: 'PIX', amountText: '99,00' }]}
        lastMethod="CASH"
        remainderCents={-100}
        partsError="A soma dos valores informados deve ser menor que o total da venda."
      />,
    )
    cy.get('[role=alert]').should('have.length', 1).and('contain', 'A soma dos valores')
  })

  it('shows the amount error under the amount field of that part', () => {
    cy.mount(
      <SplitPayment
        {...handlers}
        parts={[{ method: 'PIX', amountText: '' }]}
        lastMethod="CASH"
        remainderCents={NaN}
        partErrors={[{ amount: 'Informe um valor válido' }]}
      />,
    )
    cy.get('input[name=partAmount-0]')
      .closest('div')
      .parent()
      .find('[role=alert]')
      .should('contain', 'Informe um valor válido')
  })
})
