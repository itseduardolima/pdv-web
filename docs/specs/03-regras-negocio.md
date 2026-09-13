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
- Primeiro acesso e "esqueci meu PIN" (decisão de 2026-09-12): o operador
  pode ter **e-mail** (opcional; **obrigatório para Administrador**, senão
  o único admin da loja fica trancado sem ninguém para resetar). Ao criar
  um operador o admin informa um PIN inicial **ou** um e-mail: com e-mail e
  sem PIN, o sistema envia um link de **primeiro acesso** (vale 3 dias) e o
  operador define o próprio PIN; até lá ele não aparece na tela de Login.
  Na tela de Login existe "Esqueci meu PIN": pede o e-mail e responde
  sempre a mesma coisa, exista ou não; se existir operador ativo com ele,
  chega um link de redefinição (vale 1 hora). Todo link é de uso único e
  emitir um novo invalida o anterior. O admin também pode reenviar o link
  pela tela de Operadores. O reset manual de PIN pelo admin continua
  existindo **só para quem não tem e-mail**.

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
- Troco (decisão de 2026-09-12): em venda em Dinheiro o operador pode
  informar quanto o cliente entregou (`amountReceivedCents`, opcional). A
  API calcula o troco (`changeCents = recebido − total`) e grava os dois na
  venda — nunca aceita o troco pronto do cliente. Recebido menor que o total
  é recusado (400 `INSUFFICIENT_CASH`). Em Cartão/Pix os campos ficam nulos.
  O saldo do caixa não muda com o troco (líquido continua sendo o total da
  venda); registrar serve para rastrear, no Fechamento, uma venda com troco
  dado errado quando o caixa fecha com sobra ou falta.
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
  estoque atual. Opcionais: código de barras (se informado, único dentro do
  tenant), foto, preço de custo (fica 0 quando não informado — decisão de
  produto de 2026-09-12: o cadastro precisa ser rápido, custo pode vir
  depois).
- Categoria vem de uma lista padrão de mercadinho (`DEFAULT_PRODUCT_CATEGORIES`
  em `packages/shared`) somada às categorias que a loja já usa. A API aceita
  qualquer texto nesse campo (só valida tamanho); o formulário web restringe
  a essa lista, num seletor de opção única, sem campo de texto livre —
  decisão de produto de 2026-09-12, poucas categorias não justificam busca
  (ver `apps/web/docs/DESIGN_SYSTEM.md` para o componente).
- Estoque mínimo **não é campo do cadastro**: todo produto nasce com 5
  (`PRODUCT_LIMITS.defaultMinStock`). É usado só para alerta/indicador
  visual (ex: no Dashboard ou na lista de Produtos) — não bloqueia venda por
  si só, só some com o estoque atual no momento da venda. Um ajuste por
  produto pode virar campo avançado no futuro, se um cliente pedir.
- Limites de tamanho de campo vivem em `PRODUCT_LIMITS` (`packages/shared`):
  o schema valida com eles e o formulário só os mostra como texto de apoio.
- Excluir produto é soft-delete (mantém histórico de vendas legível) — nunca
  apagar a linha do banco.

## Operadores

- Nome completo e PIN são obrigatórios; papel (Administrador/Operador) e foto
  são definidos na criação, foto é opcional. Nome só aceita letras (com
  acento) e espaço — sem número nem símbolo (decisão de 2026-09-12; é nome
  de pessoa, diferente do nome de produto, que pode ter código/medida).
- Toggle "Operador ativo": operador inativo não consegue logar (bloqueia na
  tela de seleção de operador do Login), mas seu histórico de vendas passadas
  permanece intacto.
- Excluir operador também é soft-delete pelo mesmo motivo de produtos.
- Sempre deve existir pelo menos 1 Administrador ativo no tenant — bloquear a
  ação (inativar/excluir/rebaixar) que deixaria o tenant sem nenhum admin
  (409 `LAST_ADMIN`). Ninguém inativa, rebaixa ou exclui a própria conta,
  nem admin (409 `SELF_CHANGE`) — evita se trancar para fora num tablet
  compartilhado.

## Dashboard

- Mostra: total vendido hoje, vendas por forma de pagamento, produtos mais
  vendidos do dia, gráfico da semana. Tudo escopado ao tenant logado — nunca
  cruza dados entre tenants (ver isolamento em
  [01-arquitetura](./01-arquitetura.md)).

## Configurações da Loja

- Administrador pode editar: nome da loja, logo, cor primária, cor de acento,
  fuso horário (zona IANA).
- **Imutáveis** (não editáveis pela UI, só mudando no banco direto ou refazendo
  seed): `slug` (quebraria URLs `<slug>.app.dominio.com`) e `domain`
  (quebraria DNS/TLS).
- `primaryInkColor` (cor do texto sobre a cor primária) é calculado
  automaticamente por contraste WCAG — nunca vem do formulário, sempre
  derivado de `primaryColor`.
- Upload de logo segue o mesmo fluxo de foto de produto/operador (presigned
  POST do MinIO, validação de tipo/tamanho, URL pública gravada em `logoUrl`).
- Mudança de tema (nome/cor/logo) reflete **imediatamente** na próxima request
  — o `TenantService` lê o tema fresco a cada chamada de `GET /tenant/current`,
  sem cache (só o mapeamento host → id é cacheado, o tema em si não).
