# Regras de Negócio

Baseado no fluxo já validado no protótipo de design. Isso é a fonte da verdade
para o que cada tela precisa impor — não é decoração, é comportamento exigido.

## Papéis e permissões

Existem exatamente dois papéis (não é um sistema de permissões genérico —
manter simples de propósito):

- **Administrador**: pode tudo que Operador pode, mais:
  - Criar, editar, inativar e excluir operadores
  - Criar/revogar/resetar o PIN de qualquer operador
  - CRUD completo de produtos
  - Ver Dashboard e Fechamento de qualquer sessão de caixa
- **Operador**: pode:
  - Abrir e fechar a própria sessão de caixa
  - Realizar vendas
  - Ver produtos (sem editar)
  - Ver o próprio histórico de vendas dentro da sessão aberta

Regra dura: um Operador nunca pode alterar seu próprio papel, PIN de outro
operador, ou excluir a própria conta. Toda mutação sensível (criar operador,
resetar PIN, excluir) exige o usuário logado ter papel `admin` — validado no
servidor (`src/server/domain`), nunca só escondendo botão na UI.

## Autenticação (login por PIN)

- Login é: selecionar o operador (avatar) → digitar PIN de 4 dígitos.
- PIN é armazenado com hash (argon2), nunca em texto puro.
- Rate limit: após 5 tentativas incorretas consecutivas para o mesmo operador,
  bloquear novas tentativas por 60s (mitiga brute-force de PIN curto).
- Sessão expira por inatividade (definir: 12h é um bom padrão para não deslogar
  no meio do expediente, mas não persistir "para sempre" num tablet compartilhado).

## Caixa (abertura / fechamento)

- Um operador não pode registrar vendas sem uma sessão de caixa **aberta**.
- Abertura de caixa registra: operador que abriu, valor inicial em dinheiro
  (fundo de caixa), timestamp.
- Durante a sessão aberta, toda venda fica associada a ela (`caixa_session_id`).
- Fechamento de caixa:
  - Soma total vendido por forma de pagamento (Dinheiro, Cartão, Pix).
  - Mostra o Histórico de Vendas da sessão (substituiu a antiga tela separada
    de "Movimentações de Caixa" — decisão de produto já tomada no protótipo).
  - Uma vez fechada, a sessão é imutável — nenhuma venda pode ser adicionada a
    uma sessão fechada (mesmo por admin).
- Duas sessões de caixa não podem estar abertas ao mesmo tempo no mesmo tenant
  em v1 (1 loja = 1 caixa lógico; se o mercado tiver mais de um caixa físico,
  isso é um requisito futuro, não v1).

## Venda (PDV)

- Cada item no carrinho referencia um produto e uma quantidade; o preço
  praticado é sempre o preço vigente do produto no momento da venda (grava
  snapshot do preço na linha da venda — mudar o preço do produto depois não
  altera vendas passadas).
- Forma de pagamento: Dinheiro, Cartão ou Pix — obrigatório escolher uma antes
  de finalizar (sem split de pagamento em v1).
- Ao finalizar a venda:
  - Debita o estoque do(s) produto(s) vendido(s).
  - Gera um registro de venda com UUID (importante para sync offline, ver
    [01-arquitetura](./01-arquitetura.md)).
  - Mostra a tela "Venda Confirmada" (sem opção de imprimir — decisão já
    tomada no protótipo: o mercado-alvo não emite nota/recibo físico em v1).
- Cancelar uma venda em progresso (antes de finalizar) apenas descarta o
  carrinho — não gera registro nenhum.
- Estoque não pode ficar negativo: se a quantidade solicitada excede o estoque
  disponível, bloquear a finalização com mensagem clara (não é erro genérico).

## Produtos

- Campos obrigatórios: nome, categoria, unidade de medida, preço de venda,
  preço de custo, estoque atual, estoque mínimo, código de barras (opcional,
  mas se informado deve ser único dentro do tenant), foto (opcional).
- Estoque mínimo é usado só para alerta/indicador visual (ex: no Dashboard ou
  na lista de Produtos) — não bloqueia venda por si só, só some com o estoque
  atual no momento da venda.
- Excluir produto é soft-delete (mantém histórico de vendas legível) — nunca
  apagar a linha do banco.

## Operadores

- Nome completo e PIN são obrigatórios; papel (Administrador/Operador) e foto
  são definidos na criação, foto é opcional.
- Toggle "Operador ativo": operador inativo não consegue logar (bloqueia na
  tela de seleção de operador do Login), mas seu histórico de vendas passadas
  permanece intacto.
- Excluir operador também é soft-delete pelo mesmo motivo de produtos.
- Sempre deve existir pelo menos 1 Administrador ativo no tenant — bloquear a
  ação (inativar/excluir/rebaixar) que deixaria o tenant sem nenhum admin.

## Dashboard

- Mostra: total vendido hoje, vendas por forma de pagamento, produtos mais
  vendidos do dia, gráfico da semana. Tudo escopado ao tenant logado — nunca
  cruza dados entre tenants (ver isolamento em
  [01-arquitetura](./01-arquitetura.md)).
