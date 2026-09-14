# Product Backlog

Backlog gerado a partir da análise do protótipo clicável
(https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10) e das
regras já fixadas em [`../specs/03-regras-negocio.md`](../specs/03-regras-negocio.md).
Cada tela do protótipo virou um Épico; cada ação que o protótipo mostra
virou uma História de Usuário (HU). Estimativas em Story Points (Fibonacci:
1, 2, 3, 5, 8) — é uma referência inicial, recalibrar depois da Sprint 1.

Convenção de prioridade: **P0** bloqueia o MVP (vender algo de ponta a
ponta), **P1** é necessário para operar de verdade (não é demo, é uso real),
**P2** é melhoria que pode vir depois do primeiro cliente em produção.

## Personas

- **Operador** — funcionário do mercado, usa o caixa no dia a dia. Não é
  técnico, PIN de 4 dígitos, tela tablet a maior parte do tempo.
- **Administrador** — dona/gerente do mercado. Cadastra produtos, gerencia
  operadores, olha o Dashboard, às vezes pelo celular.
- **Revendedor** (você) — instala o sistema para um novo mercado (tenant),
  não é uma persona dentro do produto, mas é quem a Épico 1 atende.

---

## Épico 0 — Fundação técnica

Já iniciado fora do fluxo de Sprint (é infraestrutura, não HU de usuário
final), registrado aqui só para rastreabilidade.

- ✅ Monorepo (pnpm + Turborepo), `packages/shared` com schemas Zod
- ✅ `apps/api` bootstrap (NestJS: tenant context, guards, DomainError, Prisma schema)
- ✅ `apps/web` bootstrap (Next.js + Tailwind com tokens de tema, api-client, Cypress)
- ✅ `docker-compose.yml` + `Caddyfile` para a VPS
- ⬜ CI (GitHub Actions): lint + typecheck + test em todo PR — **P0**, entra na Sprint 1 (sem isso, toda sprint seguinte perde a rede de segurança)

## Épico 1 — Multi-tenant e Tema

Sem isso nenhuma outra tela funciona (toda request precisa de um tenant
resolvido) — é o alicerce, ver [`07-multitenant-whitelabel.md`](../specs/07-multitenant-whitelabel.md).

| #   | HU                                                                                                                                             | Critérios de aceite                                                                                                                                                        | Pts | Prioridade |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 1.1 | Como sistema, quero resolver o tenant pelo host da requisição, para que cada loja veja só os próprios dados.                                   | Dado um host conhecido, a API resolve o tenant e injeta no contexto da request. Dado um host desconhecido, retorna 404 `TENANT_NOT_FOUND`. Cache em memória com TTL curto. | 5   | P0         |
| 1.2 | Como Administrador, quero que o app mostre o nome e as cores da minha loja, para que o sistema pareça "meu", não genérico.                     | `GET /tenant/current` retorna nome/logo/cores. `apps/web` injeta os tokens de cor via `tenantThemeCss` no layout raiz. Trocar a cor no banco reflete sem rebuild.          | 3   | P0         |
| 1.3 | Como revendedor, quero criar um novo tenant com nome/cor/logo por script/seed, para que eu consiga onboardar um cliente novo sem tocar código. | Seed idempotente cria tenant + 1 admin. Documentado o passo a passo em `07-multitenant-whitelabel.md`.                                                                     | 2   | P1         |
| 1.4 | Como sistema, quero isolar dado por tenant também no banco (RLS), para que um bug de query nunca vaze dado entre lojas.                        | Policy de RLS ativa em toda tabela de domínio; teste comprova que uma query sem filtro de tenant não retorna nada de outro tenant.                                         | 5   | P1         |

## Épico 2 — Autenticação (Login por PIN)

Tela: **Login**. Ver regra completa em `03-regras-negocio.md` § Autenticação.

| #   | HU                                                                                                                                                                                      | Critérios de aceite                                                                                                                                 | Pts | Prioridade |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 2.1 | Como Operador, quero ver os avatares dos operadores ativos da minha loja, para escolher quem sou antes de digitar o PIN.                                                                | `GET /auth/operators` retorna só ativos, escopado ao tenant. Tela de Login lista nome+foto.                                                         | 2   | P0         |
| 2.2 | Como Operador, quero digitar meu PIN de 4 dígitos num teclado numérico, para entrar no sistema.                                                                                         | `POST /auth/login` valida PIN com hash (argon2), seta cookie httpOnly de sessão. Erro genérico "PIN incorreto" (nunca revela se o operador existe). | 5   | P0         |
| 2.3 | Como sistema, quero bloquear tentativas de PIN após 5 erros consecutivos, para dificultar brute-force de um PIN curto.                                                                  | 6ª tentativa em <60s retorna 429; contador reseta após login correto ou após a janela expirar.                                                      | 3   | P0         |
| 2.4 | Como Operador logado, quero que minha sessão dure até 12h de inatividade, para não precisar logar de novo o tempo todo mas também não ficar logado pra sempre num tablet compartilhado. | JWT com expiração de 12h (configurável); `GET /auth/me` retorna 401 quando expirado.                                                                | 2   | P0         |
| 2.5 | Como Operador, quero um botão de sair, para liberar o tablet para o próximo operador.                                                                                                   | `POST /auth/logout` limpa o cookie; UI volta para a tela de seleção de operador.                                                                    | 1   | P1         |

## Épico 3 — Produtos

Telas: **Produtos** (lista) e **Editar/Criar Produto** (form com upload de
foto). Ver `03-regras-negocio.md` § Produtos.

| #   | HU                                                                                                                                                                        | Critérios de aceite                                                                                                     | Pts | Prioridade |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 3.1 | Como Administrador, quero cadastrar um produto (nome, categoria, unidade, preço de venda/custo, estoque atual/mínimo, código de barras opcional), para vendê-lo no caixa. | `POST /products` valida campos obrigatórios; código de barras único por tenant se informado.                            | 3   | P0         |
| 3.2 | Como Operador, quero ver a lista de produtos com foto, preço e estoque, para localizar o que vou vender.                                                                  | `GET /products` com busca por nome/categoria; lista renderiza foto (ou placeholder), preço, indicador de estoque baixo. | 3   | P0         |
| 3.3 | Como Administrador, quero editar um produto existente, para corrigir preço/estoque sem recriar o cadastro.                                                                | `PATCH /products/:id`; formulário pré-preenchido idêntico ao de criação.                                                | 2   | P0         |
| 3.4 | Como Administrador, quero fazer upload de uma foto do produto, para reconhecer visualmente no grid de venda.                                                              | Upload via URL assinada (MinIO); mesma caixa de upload (dashed box) do design system, ver `DESIGN_SYSTEM.md`.           | 5   | P1         |
| 3.5 | Como Administrador, quero excluir um produto, para remover algo que não vendo mais sem perder o histórico de vendas antigas.                                              | Soft-delete (`deletedAt`); produto some da lista/venda mas `SaleItem` histórico mantém o nome congelado.                | 2   | P1         |

## Épico 4 — Abertura e Fechamento de Caixa

Telas: **Abertura de Caixa**, **Fechamento de Caixa** (com Histórico de
Vendas embutido). Ver `03-regras-negocio.md` § Caixa. HUs 4.5-4.7 (decisão
de 2026-09-13) suportam múltiplos caixas físicos por tenant — hoje o
sistema trava em "1 loja = 1 caixa lógico" (`03-regras-negocio.md:60-62`,
explicitamente marcado como requisito futuro); ver HU 11.6 (Épico 11) para
a configuração da quantidade. Comportamento atual não muda por padrão
(`registerCount = 1`).

| #   | HU                                                                                                                                                                                                     | Critérios de aceite                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Pts | Prioridade |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 4.1 | Como Operador, quero abrir o caixa informando o valor inicial em dinheiro, para começar a vender.                                                                                                      | `POST /cash-sessions`; 409 `CASH_SESSION_ALREADY_OPEN` se já existe uma aberta no tenant.                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 3   | P0         |
| 4.2 | Como sistema, quero impedir vender sem caixa aberto, para que toda venda esteja sempre associada a uma sessão.                                                                                         | Toda rota de venda checa sessão aberta; front redireciona para Abertura de Caixa se não houver.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 2   | P0         |
| 4.3 | Como Operador, quero fechar o caixa e ver o total por forma de pagamento (Dinheiro/Cartão/Pix), para confirmar o que foi vendido no turno.                                                             | `POST /cash-sessions/:id/close` soma por forma de pagamento; sessão fechada fica imutável (nenhuma venda nova aceita).                                                                                                                                                                                                                                                                                                                                                                                                                            | 5   | P0         |
| 4.4 | Como Operador, quero ver o Histórico de Vendas da sessão atual na tela de Fechamento, para revisar o que foi vendido antes de fechar.                                                                  | `GET /cash-sessions/:id/sales` lista vendas com hora, itens, forma de pagamento.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 3   | P0         |
| 4.5 | Como sistema, quero permitir até N sessões de caixa abertas simultaneamente no mesmo tenant (uma por caixa físico), para que mercados com mais de um caixa operem em paralelo sem um bloquear o outro. | `CashSession` ganha `registerNumber` (inteiro, 1..`tenant.registerCount`); abrir uma sessão num `registerNumber` já ocupado (sem `closedAt`) retorna 409 `CASH_SESSION_ALREADY_OPEN` com o número do caixa nos `details`; abrir em `registerNumber` fora do intervalo válido retorna 400 `VALIDATION`; abrir em dois `registerNumber` diferentes do mesmo tenant não colide (migration converte toda `CashSession` existente para `registerNumber = 1`, sem perda de dado); `03-regras-negocio.md` § Caixa atualizado para refletir a nova regra. | 5   | P1         |
| 4.6 | Como Operador, quero escolher em qual caixa livre vou abrir sessão, para que dois operadores possam vender ao mesmo tempo em caixas diferentes.                                                        | `GET /cash-sessions/status` (ou extensão do endpoint de sessão atual) lista todos os `registerNumber` do tenant com estado (livre / aberto por `<operador>` desde `<hora>`); tela de Abertura de Caixa mostra essa lista e só permite escolher um caixa livre; quando `registerCount === 1`, a tela se comporta exatamente como hoje (sem seletor visível) — zero mudança perceptível pro mercado de 1 caixa.                                                                                                                                     | 5   | P1         |
| 4.7 | Como Operador, quero que Vender, Fechamento e Dashboard identifiquem o caixa da minha sessão, para não me confundir com o caixa de outro operador quando há mais de um aberto.                         | `AppShell`/cabeçalho mostra "Caixa N" quando `registerCount > 1` (oculto quando é 1); Fechamento fecha só a sessão do `registerNumber` do operador logado (Admin pode escolher qual sessão aberta fechar, listando todas); `GET /dashboard/summary` continua agregando por tenant (todas as sessões do dia, de qualquer caixa) — validar que a query não dependia implicitamente de sessão única.                                                                                                                                                 | 3   | P1         |

## Épico 5 — Vender (PDV / Checkout)

Telas: **Vender**, **Venda Confirmada**. É o coração do produto — sem isso
não há valor de negócio nenhum entregue.

| #   | HU                                                                                                                         | Critérios de aceite                                                                                                  | Pts | Prioridade |
| --- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 5.1 | Como Operador, quero montar um carrinho adicionando produtos com quantidade, para preparar a venda.                        | Grid de produtos + carrinho lateral com stepper de quantidade; estado local (Zustand), sem chamar API a cada clique. | 3   | P0         |
| 5.2 | Como Operador, quero escolher a forma de pagamento (Dinheiro/Cartão/Pix) e finalizar a venda, para concluir o atendimento. | `POST /sales` grava venda + itens com preço congelado no momento da venda; debita estoque; retorna a venda criada.   | 5   | P0         |
| 5.3 | Como sistema, quero impedir finalizar uma venda que exceda o estoque disponível, para nunca vender o que não existe.       | Validação no `SaleService`; erro `INSUFFICIENT_STOCK` com mensagem clara, front bloqueia o botão/avisa qual item.    | 3   | P0         |
| 5.4 | Como Operador, quero ver a tela de Venda Confirmada após finalizar, para ter certeza de que a venda foi registrada.        | Tela mostra total, forma de pagamento, botão "Nova Venda" (sem opção de imprimir — decisão de produto já tomada).    | 1   | P0         |
| 5.5 | Como Operador, quero cancelar um carrinho em progresso sem gerar nenhum registro, para desistir de um atendimento.         | Botão "Cancelar" limpa o estado local; nenhuma chamada à API é feita.                                                | 1   | P1         |

## Épico 6 — Operadores

Telas: **Operadores** (lista) e **Criar/Editar Operador** (com Cargo,
upload de foto, toggle ativo/inativo, PIN). Ver `03-regras-negocio.md` §
Papéis e § Operadores.

| #   | HU                                                                                                                                                                | Critérios de aceite                                                                           | Pts | Prioridade |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --- | ---------- |
| 6.1 | Como Administrador, quero listar todos os operadores (ativos e inativos), para gerenciar a equipe.                                                                | `GET /operators`; lista mostra nome, papel (texto simples, não badge), toggle de ativo.       | 2   | P1         |
| 6.2 | Como Administrador, quero criar um novo operador com nome, papel e PIN inicial, para dar acesso a um novo funcionário.                                            | `POST /operators`; PIN hasheado antes de salvar; só Administrador pode chamar (`RolesGuard`). | 3   | P1         |
| 6.3 | Como Administrador, quero definir/resetar o PIN de um operador, para o caso de ele esquecer.                                                                      | `PATCH /operators/:id/pin`; exige papel admin.                                                | 2   | P1         |
| 6.4 | Como Administrador, quero ativar/inativar um operador, para bloquear o acesso sem apagar o histórico dele.                                                        | `PATCH /operators/:id/active`; operador inativo não aparece na tela de Login (HU 2.1).        | 2   | P1         |
| 6.5 | Como sistema, quero impedir que o último Administrador ativo seja inativado, excluído ou rebaixado, para nunca deixar o tenant sem ninguém que possa administrar. | Tentativa de qualquer uma dessas três ações no último admin retorna 409 `LAST_ADMIN`.         | 3   | P1         |
| 6.6 | Como Administrador, quero fazer upload da foto de perfil de um operador, seguindo o mesmo padrão visual do upload de Produto.                                     | Mesmo componente `PhotoUploadBox` reusado (ver `05-componentizacao.md`); upload via MinIO.    | 3   | P2         |
| 6.7 | Como Administrador, quero excluir um operador, para remover alguém que não trabalha mais aqui sem perder o histórico de vendas que ele registrou.                 | Soft-delete; vendas antigas mantêm `operatorId` histórico.                                    | 2   | P2         |

## Épico 7 — Dashboard

Tela: **Dashboard**.

| #   | HU                                                                                                                           | Critérios de aceite                                                                         | Pts | Prioridade |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --- | ---------- |
| 7.1 | Como Administrador, quero ver o total vendido hoje e por forma de pagamento, para acompanhar o dia sem esperar o fechamento. | `GET /dashboard/summary`; agrega vendas do dia corrente (fuso do tenant).                   | 3   | P2         |
| 7.2 | Como Administrador, quero ver os produtos mais vendidos hoje, para saber o que repor.                                        | Mesma rota, `topProductsToday` ordenado por quantidade.                                     | 2   | P2         |
| 7.3 | Como Administrador, quero ver um gráfico da semana, para entender a tendência de vendas.                                     | Agregação diária dos últimos 7 dias; gráfico simples (SVG, sem lib pesada — ver protótipo). | 3   | P2         |

## Épico 12 — Relatórios

Tela: **Relatórios** (`/reports`, só `ADMIN` — mesmo padrão de acesso do
Dashboard). Esboçada no protótipo em 2026-09-14
(https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10,
tela "Relatórios" nos 3 breakpoints). Diferença do Dashboard (Épico 7):
Dashboard é o retrato de **hoje**, sem intervalo de datas nem comparação
entre períodos; Relatórios é a versão "olhar pra trás" — período escolhido
pelo usuário, comparação com o período anterior, e duas visões que o
Dashboard não tem (vendas por operador, produtos parados). Não duplica o
que o Dashboard já mostra — reaproveita os mesmos componentes visuais
(`TotalCard`/hero, `StatTile` de forma de pagamento, gráfico SVG,
ranking de produtos) com dado agregado por intervalo em vez de "hoje".

| #    | HU                                                                                                                                                             | Critérios de aceite                                                                                                                                                                                                                                                                                                               | Pts | Prioridade |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 12.1 | Como Administrador, quero escolher o período do relatório (Hoje/Semana/Mês/Personalizado), para analisar o intervalo de tempo que me interessa.                | `GET /reports/summary?period=today\|week\|month\|custom&from&to`; `period=custom` exige `from`/`to` (400 `VALIDATION` se faltar, `from` > `to` também rejeitado); resolução de "hoje"/"semana"/"mês" usa o fuso do tenant (`Tenant.timezone`, mesma regra do Dashboard). Seletor de período (pills) no front, igual ao protótipo. | 3   | P2         |
| 12.2 | Como Administrador, quero ver o total vendido no período com comparação ao período anterior de mesmo tamanho, para saber se a loja está indo melhor.           | Resposta inclui `totalCents`, `salesCount` e `previousPeriod: { totalCents, deltaPercent }` (período anterior de duração idêntica, imediatamente anterior ao selecionado); `deltaPercent` null quando o período anterior não teve nenhuma venda (divisão por zero).                                                               | 5   | P2         |
| 12.3 | Como Administrador, quero ver o total por forma de pagamento (Dinheiro/Cartão/Pix) no período, para entender a mistura de recebimento.                         | Mesma agregação do Fechamento/Dashboard (`groupBy paymentMethod`), agora sobre o intervalo do período em vez de uma sessão/dia; reusa `StatTile`/`stile`.                                                                                                                                                                         | 2   | P2         |
| 12.4 | Como Administrador, quero ver um gráfico de vendas ao longo do período, para enxergar a tendência (não só o total).                                            | Agregação diária dentro do período (`period=month` agrega por dia, até ~31 pontos); gráfico SVG simples, mesmo estilo do Dashboard (sem lib pesada).                                                                                                                                                                              | 5   | P2         |
| 12.5 | Como Administrador, quero ver os produtos mais vendidos no período (quantidade e receita), para saber o que repor.                                             | Extensão de `topProductsToday` (Dashboard) para aceitar o intervalo do período; ordenado por quantidade, mesmo componente de ranking com barra.                                                                                                                                                                                   | 3   | P2         |
| 12.6 | Como Administrador, quero ver quanto cada operador vendeu no período, para entender a distribuição de vendas na equipe (não é vigilância, é visão de negócio). | Agregação de `Sale.totalCents` por `operatorId` dentro do período, com nome e percentual do total; só `ADMIN` (mesma regra de acesso da tela).                                                                                                                                                                                    | 3   | P2         |
| 12.7 | Como Administrador, quero ver produtos parados (sem venda ou com pouquíssima venda) no período, para decidir promoção ou desova.                               | Produtos do tenant com `quantity` vendida no período abaixo de um limite configurável (ex.: 0-2 unidades) ou nenhuma venda; requer produtos sem `SaleItem` no intervalo aparecerem também (não é só "ordenar os mais vendidos ao contrário" — precisa incluir quem não vendeu nada).                                              | 5   | P2         |

## Épico 11 — Configurações da Loja

Tela: **Configurações da Loja** (`/settings` ou `/store-settings`). Permite ao
Administrador ajustar a identidade visual e configurações operacionais da loja
sem precisar editar o banco manualmente ou refazer o seed. É parte do
white-label: o dono da loja deve poder trocar nome/logo/cores quando quiser,
sem depender do revendedor.

| #    | HU                                                                                                                                                                                    | Critérios de aceite                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Pts | Prioridade |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| 11.1 | Como Administrador, quero editar o nome da minha loja, para corrigir erro de cadastro ou atualizar quando a identidade mudar.                                                         | `PATCH /tenant/current` (só `ADMIN`); campo `name` obrigatório, valida tamanho (1–100 chars); `slug` e `domain` **não** são editáveis (imutáveis — quebrariam URLs/DNS); alteração reflete na UI imediatamente (cache do tema já é invalidado a cada request, ver `tenant.service.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 3   | P1         |
| 11.2 | Como Administrador, quero trocar a logo da minha loja, para personalizar a marca sem recriar o tenant.                                                                                | Campo `logoUrl` opcional no form; upload via `/uploads` (MinIO, mesmo fluxo de Produto/Operador); aceita PNG/JPEG/WebP até 5 MB; logo `null` é válido (sistema mostra nome da loja sem imagem); componente `PhotoUploadBox` reusado com `kind="tenant"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 3   | P1         |
| 11.3 | Como Administrador, quero escolher a cor primária da loja, para combinar com a identidade visual da marca.                                                                            | Campo `primaryColor` obrigatório, validado como hex (`#rrggbb`); `primaryInkColor` **não** é editável (calculado automaticamente por contraste WCAG em `tenant.service.ts:60`, nunca vem do form); color picker no frontend — swatch grande (`input type="color"`) que abre o seletor visual nativo do navegador (arrasta matiz/saturação, sem precisar digitar hex), mais o campo hex pra quem já sabe o código; mudança reflete na próxima request (tema já é lido fresco, sem cache no `TenantService`). `accentColor` **não** é editável nesta HU (decisão de 2026-09-13: usuário leigo não lida bem com duas cores/hex ao mesmo tempo) — continua salvo sem alteração a cada PATCH; o `updateTenantSchema` do backend não mudou (ainda pede `accentColor` no payload). | 3   | P1         |
| 11.4 | Como Administrador, quero ajustar o fuso horário da loja, para que o Dashboard e os totais do dia usem o horário correto da minha região.                                             | Campo `timezone` obrigatório; select com zonas IANA comuns do Brasil (`America/Sao_Paulo`, `America/Manaus`, `America/Fortaleza`, etc.); validação no backend rejeita zona inválida (400 `VALIDATION`, campo `timezone`); afeta `GET /dashboard/summary` (o que é "hoje" muda conforme o fuso).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 2   | P2         |
| 11.5 | Como Administrador, quero ver uma prévia ao vivo da cor escolhida, para não precisar salvar/recarregar a página para testar se a cor funciona.                                        | Preview no próprio formulário: aplica a cor primária num mini card de exemplo (`ColorPreviewCard`, botão de exemplo com a tinta calculada no cliente); só CSS/estado local, sem chamar API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 2   | P2         |
| 11.6 | Como Administrador, quero definir quantos caixas físicos minha loja tem, para habilitar caixas adicionais sem depender do revendedor (decisão de 2026-09-13, ver Épico 4 HU 4.5-4.7). | Campo `registerCount` (inteiro) em `PATCH /tenant/current`, só `ADMIN`; valida intervalo 1-10 (400 `VALIDATION` fora dele); reduzir abaixo do maior `registerNumber` com sessão aberta é bloqueado (409, mensagem indica qual caixa fechar primeiro); default do tenant é 1 (tenant existente não muda de comportamento sem ação do admin); campo some/mostra "Quantidade de caixas" em `/settings`.                                                                                                                                                                                                                                                                                                                                                                        | 3   | P1         |

## Épico 8 — Offline-first (PWA)

Sem isso o caixa para de vender se a internet da loja cair — é a diferença
entre "protótipo bonito" e "sistema que funciona no mercado de verdade". Ver
`01-arquitetura.md` § Offline-first.

| #   | HU                                                                                                                                                            | Critérios de aceite                                                                      | Pts | Prioridade |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --- | ---------- |
| 8.1 | Como Operador, quero que o catálogo de produtos funcione mesmo sem internet, para continuar vendendo.                                                         | Cache do catálogo em IndexedDB (Dexie), `stale-while-revalidate`.                        | 5   | P1         |
| 8.2 | Como Operador, quero que uma venda feita sem internet seja registrada localmente e sincronizada depois, para nunca perder uma venda por falha de rede.        | Fila `pendingSales` com UUID gerado no cliente; `POST /sales/sync` idempotente por UUID. | 8   | P1         |
| 8.3 | Como Administrador, quero que o app seja instalável (PWA) com o nome/ícone da minha loja, para os operadores acessarem como um app, não uma aba de navegador. | Manifest dinâmico por tenant (`app/manifest.ts`); testado em Android/Chrome.             | 3   | P2         |

## Épico 9 — Deploy e Operação (VPS)

| #   | HU                                                                                                                          | Critérios de aceite                                                             | Pts | Prioridade |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --- | ---------- |
| 9.1 | Como revendedor, quero subir o ambiente completo com um comando, para colocar um cliente novo em produção rapidamente.      | `docker compose up -d --build` sobe web+api+postgres+minio+caddy; documentado.  | 3   | P0         |
| 9.2 | Como revendedor, quero HTTPS automático nos domínios da aplicação, para não expor a loja sem criptografia.                  | Caddy emite/renova Let's Encrypt automaticamente; validado com domínio real.    | 2   | P0         |
| 9.3 | Como revendedor, quero backup diário do banco, para não perder dados num incidente da VPS.                                  | `pg_dump` agendado (cron) para destino externo (não só o disco da própria VPS). | 2   | P1         |
| 9.4 | Como time, quero deploy automático via CI ao mergear na branch principal, para não depender de passo manual sujeito a erro. | GitHub Actions builda, testa e faz deploy via SSH.                              | 3   | P1         |

## Épico 10 — Validação e Feedback (transversal)

O protótipo é um mockup estático: não tem estado de erro nem confirmação de
ação. Decisão de produto: **sem toast**; feedback ancorado no componente que
gerou a ação, e **toda regra/mensagem de validação vem do backend** — o
frontend só exibe (ver `apps/web/docs/DESIGN_SYSTEM.md` § Validação e
feedback e `04-padroes-codigo.md` § Formulários). É infraestrutura de UI
usada por todo formulário/ação dos Épicos 3, 4, 5 e 6 — entra antes ou junto
do primeiro form real, não depois.

| #    | HU                                                                                                                                                             | Critérios de aceite                                                                                                                                    | Pts | Prioridade |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ---------- |
| 10.1 | Como Operador, quero ver a mensagem de erro exatamente no campo que preenchi errado, para corrigir sem procurar onde foi o problema.                           | Submit chama a API; erro 400 (`code: "VALIDATION"`) mapeia `details.fieldErrors` para cada input; nenhuma validação roda no cliente antes da resposta. | 3   | P0         |
| 10.2 | Como Operador, quero ver um erro de regra de negócio (ex.: "caixa já aberto") num aviso dentro do próprio card da ação, não numa notificação que some sozinha. | Componente `InlineAlert` (ver DESIGN_SYSTEM.md); mensagem exibida é exatamente o `message` que a API retornou, sem reescrita no cliente.               | 3   | P0         |
| 10.3 | Como Operador, quero que o botão de salvar mostre visualmente que a ação deu certo, sem precisar de uma notificação separada.                                  | `Button` com `state="loading"/"success"`; usado em Produto/Operador/Abertura de Caixa.                                                                 | 2   | P1         |

---

## Resumo de esforço por Épico (P0 + P1, o que define o MVP)

| Épico                     | Pts P0 | Pts P1 | Pts P2 |
| ------------------------- | ------ | ------ | ------ |
| 0 — Fundação              | —      | —      | —      |
| 1 — Multi-tenant/Tema     | 8      | 7      | —      |
| 2 — Autenticação          | 12     | 1      | —      |
| 3 — Produtos              | 8      | 7      | —      |
| 4 — Caixa                 | 13     | 13     | —      |
| 5 — Vender                | 12     | 1      | —      |
| 6 — Operadores            | —      | 12     | 5      |
| 7 — Dashboard             | —      | —      | 8      |
| 8 — Offline (PWA)         | —      | 13     | 3      |
| 9 — Deploy                | 5      | 5      | —      |
| 10 — Validação e Feedback | 6      | 2      | —      |
| 11 — Configurações        | —      | 12     | 4      |
| 12 — Relatórios           | —      | —      | 26     |
| **Total**                 | **64** | **73** | **46** |

MVP (P0, "consigo vender algo de ponta a ponta em produção") = **64 pontos**.
Produto completo para operação real (P0 + P1) = **137 pontos**.
