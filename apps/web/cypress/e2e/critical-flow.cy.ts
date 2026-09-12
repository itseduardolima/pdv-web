// Fluxo crítico do produto (SPRINTS.md § Definition of Done):
// login → abrir caixa → vender → fechar caixa, contra a API real.
describe('Fluxo crítico: login, abrir caixa, vender, fechar caixa', () => {
  it('completes a full shift through the UI', () => {
    // estado inicial determinístico: nenhum caixa aberto
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterClosed()
    cy.clearCookies()

    // login pela tela
    cy.visit('/login')
    cy.contains('h1', 'Quem está no caixa?')
    cy.contains('button', 'Administrador').click()
    for (const digit of ['1', '2', '3', '4']) cy.contains('button', digit).click()
    cy.contains('button', 'Entrar').click()

    // sem caixa aberto cai na Abertura
    cy.location('pathname').should('eq', '/open-register')
    cy.contains('h1', 'Abertura de Caixa')
    cy.contains('button', 'R$ 100').click()
    cy.contains('button', 'Abrir Caixa').click()

    // vender
    cy.location('pathname').should('eq', '/sell')
    cy.contains('h1', 'Vender')
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
    cy.get('button[aria-label="Adicionar Arroz 5kg"]').click()
    cy.get('[data-cy=cart-line]').should('have.length', 1).and('contain', 'Arroz')
    cy.get('[data-cy=cart-line] output').should('have.text', '2')

    // sem forma de pagamento: a API responde e a mensagem aparece embaixo do seletor
    cy.contains('button', 'Finalizar Venda').click()
    cy.contains('Escolha a forma de pagamento')
    cy.contains('[role=radio]', 'Pix').click()
    cy.contains('button', 'Finalizar Venda').click()

    // venda confirmada
    cy.location('pathname').should('eq', '/sell/confirmed')
    cy.contains('Venda finalizada!')
    cy.contains('Pago com Pix')
    cy.contains('2x Arroz')
    cy.contains('button', 'Nova Venda').click()
    cy.location('pathname').should('eq', '/sell')

    // fechar caixa: a venda está no histórico e nos totais
    cy.contains('a', 'Fechamento').click()
    cy.location('pathname').should('eq', '/closing')
    cy.contains('Histórico de Vendas')
    cy.contains('2 itens · Administrador · Pix')
    cy.contains('1 venda realizada')
    cy.contains('button', 'Confirmar Fechamento').click()

    // o botão mostra "Caixa fechado" por ~600ms e volta para a Abertura
    cy.location('pathname', { timeout: 15_000 }).should('eq', '/open-register')
    cy.contains('h1', 'Abertura de Caixa')
  })

  it('computes the change for a cash sale, and the API refuses a received amount below the total', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    cy.visit('/sell')
    // Sal Refinado 1kg custa R$ 2,49
    cy.get('button[aria-label="Adicionar Sal Refinado 1kg"]').click()
    cy.contains('[role=radio]', 'Dinheiro').click()

    // troco ao vivo enquanto digita (máscara estilo calculadora: "500" -> R$ 5,00)
    cy.get('input[name=amountReceived]').type('500')
    cy.get('[data-cy=cash-change]').should('contain', 'Troco').and('contain', '2,51')

    // menor que o total: só aviso visual; quem recusa é a API, no campo
    cy.get('input[name=amountReceived]').clear().type('100')
    cy.get('[data-cy=cash-change]').should('contain', 'Faltam').and('contain', '1,49')
    cy.contains('button', 'Finalizar Venda').click()
    cy.get('[data-cy=cash-received] [role=alert]').should('contain', 'Valor recebido menor que o total da venda.')

    cy.get('input[name=amountReceived]').clear().type('500')
    cy.contains('button', 'Finalizar Venda').click()
    cy.location('pathname').should('eq', '/sell/confirmed')
    cy.get('[data-cy=confirmed-change]').should('contain', 'Troco').and('contain', '2,51')
    cy.contains('button', 'Nova Venda').click()
  })

  it('blocks a sale above the available stock, naming the product', () => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
    cy.visit('/sell')
    // Feijão 1kg tem 30 no seed; 31 cliques excedem
    for (let i = 0; i < 31; i += 1) cy.get('button[aria-label="Adicionar Feijão 1kg"]').click()
    cy.contains('[role=radio]', 'Dinheiro').click()
    cy.contains('button', 'Finalizar Venda').click()
    cy.get('[role=alert]').should('contain', 'Estoque insuficiente').and('contain', 'Feijão')
    cy.get('[data-cy=cart-line][data-highlighted=true]').should('contain', 'Feijão')
    cy.contains('button', 'Cancelar').click()
    cy.get('[data-cy=cart-line]').should('not.exist')
  })
})
