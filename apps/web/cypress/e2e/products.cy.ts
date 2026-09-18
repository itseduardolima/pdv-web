// CRUD de produto pela tela, com erro de campo vindo da API (HU 10.1).
describe('Produtos: criar, editar e excluir', () => {
  const name = `E2E Café ${Date.now()}`

  beforeEach(() => {
    cy.loginAs('Administrador', '1234')
    cy.ensureRegisterOpen()
  })

  it('creates, edits and deletes a product', () => {
    cy.visit('/products/new')
    cy.contains('h1', 'Novo Produto')

    // submit vazio: as mensagens de campo vêm da API, embaixo de cada campo
    cy.contains('button', 'Salvar Produto').click()
    cy.contains('O nome precisa ter pelo menos 2 caracteres')
    cy.contains('Informe a categoria')

    cy.get('input[name=name]').type(name)
    cy.contains('label', 'Categoria').click()
    cy.contains('[role=option]', 'Bebidas').click()
    cy.contains('label', 'Unidade').click()
    cy.contains('[role=option]', 'Pct (pacote)').click()
    cy.get('input[name=salePrice]').type('12,90')
    cy.get('button[aria-label=Aumentar]').click().click().click()
    cy.contains('button', 'Salvar Produto').click()
    cy.contains('Salvo')
    cy.location('pathname').should('eq', '/products')
    cy.contains(name).should('exist')
    cy.contains('R$ 12,90')

    // editar
    cy.get(`a[aria-label="Editar ${name}"]`).first().click({ force: true })
    cy.contains('h1', 'Editar Produto')
    // Categoria/Unidade pré-carregados têm que aparecer selecionados, não o
    // placeholder — o Select de Categoria depende de uma lista assíncrona
    // (categorias em uso) e já teve regressão nisso.
    cy.contains('button[role=combobox]', 'Bebidas')
    cy.contains('button[role=combobox]', 'Pct (pacote)')
    cy.get('input[name=salePrice]').clear().type('13,50')
    cy.contains('button', 'Salvar Produto').click()
    cy.location('pathname').should('eq', '/products')
    cy.contains('R$ 13,50')

    // excluir
    cy.get(`a[aria-label="Editar ${name}"]`).first().click({ force: true })
    cy.contains('button', 'Excluir Produto').click()
    // o botão do diálogo, não o "Excluir Produto" atrás do overlay
    cy.get('[role=dialog]').contains('button', 'Excluir').click()
    cy.location('pathname').should('eq', '/products')
    cy.contains(name).should('not.exist')
  })

  it('shows a character counter, masks the price while typing and keeps the barcode digits-only', () => {
    cy.visit('/products/new')

    // contador de caracteres embaixo do campo, alinhado à direita
    cy.get('input[name=name]').type('Café')
    cy.contains('4/120')

    // código de barras: letras digitadas nunca entram, só os números
    cy.get('input[name=barcode]').type('abc123def456')
    cy.get('input[name=barcode]').should('have.value', '123456')
    cy.contains('6/64')

    // preço de venda: máscara estilo calculadora, dígito por dígito
    cy.get('input[name=salePrice]').type('1299')
    cy.get('input[name=salePrice]').should('have.value', '12,99')
  })
})
