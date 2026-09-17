# TODO

Checklist vivo do projeto. **Toda sessão/agente que trabalhar neste
repositório precisa ler este arquivo primeiro** (é a primeira linha do
`CLAUDE.md`) e **atualizá-lo antes de terminar a sessão**: marcar `[x]` o
que foi concluído, adicionar linha nova se surgir trabalho não previsto,
mover o "Em andamento" para refletir onde o trabalho parou.

Detalhe de cada item (critério de aceite, story points, prioridade) está em
[`docs/scrum/BACKLOG.md`](./docs/scrum/BACKLOG.md); a ordem/agrupamento por
sprint está em [`docs/scrum/SPRINTS.md`](./docs/scrum/SPRINTS.md). Este
arquivo é só o estado — não duplique critério de aceite aqui, só referencie
o número da HU.

Regra de marcação: só marque `[x]` quando bater a Definition of Done de
`docs/scrum/SPRINTS.md` (typecheck + testes + sem regra duplicada no
frontend) — não quando o código só "existe".

## Em andamento agora

- Sprints 0 a 10 concluídas, exceto 9.3/9.4 (backup diário, deploy automático
  via CI) — ficaram pendentes da Sprint 8, sem sprint própria ainda.
- Sprint 9 (Múltiplos Caixas, decisão de 2026-09-13/14) concluída: 4.5, 4.6,
  4.7 e 11.6 — ver seção própria abaixo.
- Sprint 10 (Relatórios, decisão de 2026-09-14) concluída: 12.1-12.7 — ver
  seção própria abaixo.
- Próximo: 9.3/9.4, ou nova prioridade a definir com o usuário.

---

## Sprint 0 — Fundação técnica

- [x] Monorepo pnpm + Turborepo
- [x] `packages/shared` com schemas Zod (contrato de API)
- [x] `apps/api` bootstrap: tenant context (`AsyncLocalStorage`), `AuthGuard`/`RolesGuard` globais, `DomainError` + `DomainExceptionFilter`, `schema.prisma` completo
- [x] `apps/web` bootstrap: Next.js + Tailwind com tokens de tema, `api-client` tipado, Cypress configurado
- [x] `docker-compose.yml` + `Caddyfile` para a VPS
- [x] CI (GitHub Actions: lint + typecheck + test + build em todo PR, `.github/workflows/ci.yml`)

## Sprint 1 — Tenant + Autenticação

- [x] 1.1 — Resolução de tenant por host (`TenantResolver` + módulo `tenant`)
- [x] 1.2 — `GET /tenant/current` + tema aplicado no `apps/web`
- [x] 2.1 — Lista de operadores para a tela de Login
- [x] 2.2 — Login por PIN (hash argon2, cookie de sessão)
- [x] 2.3 — Rate-limit de tentativas de PIN
- [x] 2.4 — Expiração de sessão (12h)
- [x] 2.5 — Logout

## Sprint 2 — Produtos + padrão de Validação/Feedback

- [x] 10.1 — Erro de campo mapeado da resposta da API (sem validação no cliente)
- [x] 10.2 — Componente `InlineAlert` (substitui toast)
- [x] 3.1 — Criar produto
- [x] 3.2 — Listar produtos (busca)
- [x] 3.3 — Editar produto
- [x] 10.3 — Botão com estado loading/success
- [x] 1.3 — Seed de novo tenant documentado

## Sprint 3 — Caixa (Abertura/Fechamento) + foto de Produto

- [x] 4.1 — Abrir caixa
- [x] 4.2 — Bloquear ações sem caixa aberto (route group `(operating)`; a checagem na API acontece ao criar venda, HU 5.2)
- [x] 4.3 — Fechar caixa com totais por forma de pagamento
- [x] 4.4 — Histórico de vendas na tela de Fechamento
- [x] 3.4 — Upload de foto do produto (MinIO)
- [x] 3.5 — Excluir produto (soft-delete)

## Sprint 4 — Vender (core do produto)

- [x] 5.1 — Montar carrinho
- [x] 5.2 — Finalizar venda (Dinheiro/Cartão/Pix) — sem caixa aberto a API responde 409 `CASH_SESSION_NOT_OPEN`
- [x] 5.3 — Bloqueio de estoque insuficiente
- [x] 5.4 — Tela de Venda Confirmada
- [x] 5.5 — Cancelar carrinho

## Sprint 5 — Deploy do primeiro cliente real

- [x] 9.1 — `docker compose up` completo, documentado (README § Deploy na VPS + `scripts/deploy-check.sh`)
- [~] 9.2 — HTTPS automático (Caddy + Let's Encrypt, `on_demand_tls` com `tls-check`) — implementado; **validar com domínio real no primeiro deploy**
- [x] 1.4 — Row-Level Security no Postgres (policies + extensão do Prisma + usuário sem superusuário)
- [x] Testes E2E Cypress dos fluxos críticos (login → abrir caixa → vender → fechar caixa) + CRUD de produto (`apps/web/cypress/e2e`, job `e2e` no CI)
- [x] Troco em venda em Dinheiro (API calcula/valida, front só exibe) — E2E cobre troco ao vivo e recusa de valor menor

## Extra — Atalho "Ajustar estoque" na venda (decisão de 2026-09-12)

- [x] `INSUFFICIENT_STOCK` na venda ganha ação "Ajustar estoque" no `InlineAlert` (só Administrador): abre `QuickStockDialog` pré-preenchido com o estoque atual, salva via `PATCH /products/:id` e deixa finalizar a venda sem sair da tela. Component tests + E2E.

## Sprint 6 — Operadores (gestão completa) + Dashboard

- [x] 6.1 — Listar operadores (ativos e inativos) — `GET /operators` + `/operators` (`OperatorCard`)
- [x] 6.2 — Criar operador — `POST /operators` (PIN argon2) + `/operators/new` (`OperatorForm`)
- [x] 6.3 — Resetar PIN de operador — `PATCH /operators/:id/pin` + bloco "Resetar PIN" na edição
- [x] 6.4 — Ativar/inativar operador — `PATCH /operators/:id/active` + `Toggle` na lista; inativo some do Login
- [x] 6.5 — Regra do último Administrador — 409 `LAST_ADMIN` (+ 409 `SELF_CHANGE` para a própria conta), Jest no Service
- [x] 6.6 — Upload de foto do operador — `PhotoUploadBox` kind `operator`
- [x] 6.7 — Excluir operador (soft-delete) — `DELETE /operators/:id` + `ConfirmDialog`; E2E `operators.cy.ts`
- [x] 7.1 — Dashboard: total do dia por forma de pagamento — `GET /dashboard/summary` (fuso da loja, `Tenant.timezone`) + `/dashboard`
- [x] 7.2 — Dashboard: mais vendidos hoje — 5 por quantidade, com foto (`TopProductRow`)
- [x] 7.3 — Dashboard: gráfico da semana — `WeekChart` em SVG puro, 7 dias zerados quando sem venda; E2E `dashboard.cy.ts`

## Extra — E-mail: primeiro acesso e "esqueci meu PIN" (decisão de 2026-09-12)

- [x] API: `Operator.email` (único por tenant, obrigatório p/ admin), `pinHash` nulo = primeiro acesso, `PinToken` com RLS, módulo `mail` (`log`/`smtp`), `POST /auth/forgot-pin`, `GET /auth/pin-token/:token`, `POST /auth/set-pin`, `POST /operators/:id/send-pin-link`; specs 01/03/08/09 atualizadas; Jest
- [x] Web: e-mail no cadastro de operador (PIN opcional quando há e-mail), "Esqueci meu PIN" no Login → `/forgot-pin`, tela `/set-pin?token=`, "Enviar/Reenviar link" na edição (reset manual só sem e-mail), pílula "Primeiro acesso pendente" na lista; E2E `pin-recovery.cy.ts` + `operators.cy.ts`

## Extra — Filtro por categoria em Produtos e Vender (decisão de 2026-09-12)

- [x] `CategoryFilter` (chips, reusado): em Produtos filtra no servidor (`category` já existia na API); em Vender filtra em memória junto com a busca. Component tests + smoke manual.

## Extra — Login com muitos operadores (decisão de 2026-09-12)

- [x] `OperatorAvatarPicker`: grade com altura máxima + rolagem própria e nome truncado numa linha, para equipe grande ou nome comprido nunca empurrar o teclado de PIN pra fora da tela. Component tests.
- [x] Nome de operador só aceita letra (com acento) e espaço — sem número nem símbolo.
- [x] Corte tablet × desktop movido de `lg` (1024px) pra `xl` (1280px) na `Sidebar` e na `SplitAuthLayout`: tablet deitado (iPad ~1024–1194px) passava de `lg` e virava "desktop" (sidebar expandida, ilustração) mesmo sem ser.
- [x] Vender: grid de produtos ganha altura máxima + rolagem própria abaixo de `md` (crescia com a quantidade de produtos, empurrando o carrinho pra fora da tela); proporção catálogo/carrinho e nº de colunas ajustados por faixa (retrato, paisagem, desktop).

## Extra — Cartão de total idêntico ao protótipo (decisão de 2026-09-13)

- [x] `TotalCard`/`TotalAmount` (reuso em Fechamento e Dashboard): textura de pontinhos no fundo escuro + só a parte inteira do valor em destaque na cor primária, igual ao protótipo.

## Extra — Calculadora em Vender (decisão de 2026-09-13)

- [x] Botão de calculadora no cabeçalho de Vender (à esquerda do badge "Caixa #N") — ajuda o operador a dividir conta com o cliente sem sair da venda. `Calculator`/`CalculatorDialog`, lógica pura testável, sem ligação com carrinho/venda. Component tests.

## Sprint 7 — Configurações da Loja

- [x] 11.1 — Editar nome da loja (`PATCH /tenant/current`, só `ADMIN`; `slug`/`domain` imutáveis) — página `/settings` (nav só ADMIN), `updateTenantSchema` já cobre 11.1-11.4 (logo/cores/timezone viajam inalterados até as HUs deles serem feitas); `publicTenantSchema` ganhou `timezone` (faltava para o form montar o payload completo)
- [x] 11.2 — Upload de logo (`logoUrl` opcional, MinIO via `/uploads`, `PhotoUploadBox` kind `tenant-logo`) — mesmo fluxo de Produto/Operador (ticket assinado + confirm), sem endpoint novo (backend já cobria `tenant-logo` no `uploadKindSchema` e o controller de `/uploads` já era `ADMIN`-only). Cypress E2E cobre editar nome e bloqueio pra Operador
- [x] 11.3 — Escolher cor primária (`primaryColor` hex obrigatório; `primaryInkColor` calculado, não editável) — novo componente `ColorInput` (swatch grande `type="color"`, abre o seletor visual nativo do navegador — arrasta matiz/saturação sem digitar hex — + hex digitável pra quem já sabe o código). **Decisão de 2026-09-13**: `accentColor` saiu do form (usuário leigo não lida bem com duas cores/hex ao mesmo tempo) — `docs/scrum/BACKLOG.md` HU 11.3 já atualizado; `accentColor` continua salvo sem mudança a cada PATCH (schema do backend não mudou)
- [x] 11.4 — Ajustar fuso horário (select IANA, valida no backend, afeta Dashboard) — `Select` com `BR_TIMEZONES` (lista de apoio em `lib/timezones.ts`, backend aceita qualquer IANA válido via `Intl`)
- [x] 11.5 — Preview ao vivo das cores (mini card no form, só CSS local, sem API) — `ColorPreviewCard` com botão de exemplo na cor primária digitada, tinta calculada no cliente (`lib/utils/contrast-ink-color.ts`, mesma fórmula do backend, só pra prévia — o valor que vale é sempre recalculado no PATCH). Cypress E2E cobre a prévia atualizando ao vivo (sem salvar) e o fluxo completo de nome/cor/fuso

## Sprint 8 — Offline-first (PWA)

- [x] 8.1 — Cache de catálogo offline (Dexie) — `lib/offline/db.ts` (banco `pdv-web-<tenantId>`, v1 só `productsCache` + `meta`; `pendingSales` entra na v2 com a 8.2) e `lib/offline/products-cache.ts`. `useProducts`/`useProductCategories` com `networkMode: 'always'`: toda resposta boa da lista completa vai pro IndexedDB; `NETWORK_ERROR` ou 5xx caem no cache (busca/categoria filtradas no cliente). Sem sync prévio, o erro sobe normal. Cypress E2E `sell-offline.cy.ts` derruba `/products*` e confere Vender funcionando. Sem indicador visual "usando catálogo salvo" ainda — decidir junto com a 8.2
- [x] 8.2 — Fila de vendas offline + sincronização idempotente — backend: `POST /sales/sync` (`SaleService.syncBatch`, sequencial, cada venda com seu próprio resultado — uma com erro de regra, ex. estoque acabou nesse meio-tempo, não derruba as outras do lote; `syncSalesResultSchema` novo em `packages/shared`). Frontend: `lib/offline/pending-sales.ts` (fila `pendingSales` no Dexie, v2), `lib/offline/sync.ts` (`syncPendingSales`, só remove da fila o que voltou `ok:true`), `lib/offline/local-sale.ts` (monta um `Sale` local pra "Venda Confirmada" responder na hora, sem esperar servidor). `handleCheckout` (`use-sell-page.ts`) cai na fila quando `isBackendUnreachable`; `useOfflineSalesSync` roda no `AppShell` (monta, evento `online`, fallback a cada 30s). Sem UI de conflito ainda pra uma venda que falhou de verdade no sync (ex. sem estoque) — fica só logada no console, decidir apresentação visual depois. 4 testes Jest novos (`sale.service.spec.ts`) + Cypress E2E `sell-offline-sync.cy.ts` (fila → sync → sem duplicar)
- [x] 8.3 — PWA instalável com identidade do tenant — `app/manifest.ts` dinâmico (nome/short_name/theme_color do tenant; ícone = `logoUrl` quando existe, senão os ícones padrão em `public/icons/pwa/`); `generateMetadata`/`generateViewport` em `layout.tsx` seguem a mesma regra pro favicon da aba e pro `theme-color`. Service worker via Serwist (`app/sw.ts` + `withSerwist` no `next.config.mjs`, **desligado em dev** — só compila em build de produção): cacheia shell + `/api/products*` (stale-while-revalidate), nunca cacheia `/login`, `/forgot-pin`, `/set-pin` nem `/api/auth/*` (network-only). Validado com `next build` + `next start` reais (manifest, favicon, `sw.js` e `<link rel="icon">` do tenant conferidos por `curl`)
  - [x] Favicon: `~/Downloads/favicon.ico` copiado pra `apps/web/src/app/favicon.ico` (convenção do Next — vira o default da plataforma); com logo, o `<link rel="icon">` passa a ser o do tenant (white-label, spec 06/07)
- [ ] 9.3 — Backup diário do banco
- [ ] 9.4 — Deploy automático via CI

## Sprint 9 — Múltiplos Caixas (concluída — decisão de 2026-09-13/14)

Hoje o sistema trava em "1 loja = 1 caixa lógico" por tenant
(`docs/specs/03-regras-negocio.md` § Caixa). HUs novas em
`docs/scrum/BACKLOG.md` Épico 4 (4.5-4.7) e Épico 11 (11.6), detalhe do
plano em `docs/scrum/SPRINTS.md`. Sem dependência de sprint específica —
comportamento atual não muda por padrão (`registerCount = 1`).

- Correções pós-review/teste manual (2026-09-14), todas com `typecheck`+`lint`
  passando: (1) code review próprio achou e corrigiu 4 problemas — `GET
/cash-sessions/:id`/`:id/sales` sem checagem de dono (Operador conseguia
  ver Fechamento de outro caixa via `sessionId` exposto em `/registers`,
  agora exige dono ou Admin); corrida em `open()` virando 500 em vez de 409
  (índice único agora tratado, `RegisterAlreadyOpenError`); corrida no
  seletor de caixa da Abertura (podia submeter antes da lista carregar);
  corrida ao reduzir `registerCount` (check+update agora na mesma
  transação). (2) Teste manual revelou que `(operating)/layout.tsx` e
  `open-register/layout.tsx` ainda usavam o caixa "de qualquer um" do
  tenant pra decidir acesso — um Operador sem caixa próprio nunca chegava
  na Abertura se OUTRO caixa já estivesse aberto (`getMyCashSession` novo,
  escopado ao operador, corrige os dois guards; Admin continua entrando
  sem caixa próprio se a loja estiver operando). (3) Fechamento só mostrava
  o seletor de "outros caixas" quando o Admin não tinha um próprio — agora
  o seletor sempre aparece com mais de 1 caixa aberto, dele incluso, pra
  Admin poder fechar qualquer um. (4) Abertura de Caixa não tinha como
  trocar de operador sem abrir um caixa órfão — botão "Trocar de operador"
  adicionado (desloga sem precisar abrir nada).
- [x] 11.6 — Administrador define a quantidade de caixas em Configurações da Loja — `Tenant.registerCount` exposto em `PublicTenant`/`updateTenantSchema` (`TENANT_LIMITS.registerCount` 1-10); `PATCH /tenant/current` bloqueia reduzir abaixo do maior `registerNumber` com sessão aberta (409 `REGISTER_IN_USE`, `details.registerNumber`) via `TenantRepository.findMaxOpenRegisterNumber`; `/settings` ganhou o `Select` "Quantidade de caixas" (`REGISTER_COUNT_OPTIONS`). Jest cobre reduzir sem colisão e 409 reduzindo com caixa aberto
- [x] 4.5 — API permite N sessões de caixa abertas simultaneamente — `Tenant.registerCount` (default 1) + `CashSession.registerNumber`; índice único parcial `(tenantId, registerNumber) WHERE closedAt IS NULL` substitui o antigo `(tenantId) WHERE closedAt IS NULL`; `open()` valida `registerNumber` contra `tenant.registerCount` (400 `VALIDATION`) e contra sessão já aberta naquele caixa (409 `CASH_SESSION_ALREADY_OPEN`, `details.registerNumber`); migration converte todo tenant/sessão existente para `registerCount = 1`/`registerNumber = 1`, zero mudança de comportamento sem ação do admin. `openCashSessionSchema.registerNumber` opcional (default 1) até a tela de seleção existir (HU 4.6). Jest cobre: default pro caixa 1, 409 no caixa já aberto, dois caixas diferentes abrindo sem colidir, 400 fora do intervalo. `03-regras-negocio.md` § Caixa atualizado
- [x] 4.6 — Operador escolhe um caixa livre na tela de Abertura de Caixa — `GET /cash-sessions/registers` (`CashSessionService.listRegisters`, monta status 1..registerCount a partir das sessões abertas); `useCashSessionRegisters` + seletor de caixa em `open-register/page.tsx` (só aparece quando há mais de 1 caixa; pré-seleciona automaticamente se sobrar exatamente 1 livre; caixa ocupado mostra o nome de quem abriu e fica desabilitado); `registerCount = 1` (todo tenant hoje) mantém a tela idêntica à anterior, sem seletor. Jest cobre `listRegisters` (todos livres, e um ocupado com nome/hora)
- [x] 4.7 — Vender/Fechamento/Dashboard identificam o caixa da sessão atual — `GET /cash-sessions/current` (tenant-wide, "a loja está operando hoje") virou dois conceitos: mantido como está para o guard de rota `(operating)/layout.tsx` (nenhuma mudança de comportamento — continua bastando QUALQUER caixa aberto no tenant pra liberar Vender/Produtos/Fechamento/Dashboard/Operadores, mesmo pra quem não abriu nenhum); `GET /cash-sessions/mine` novo, escopado ao operador logado (`CashSessionService.getMine`/`findOpenByOperator`), consumido por `useCurrentCashSession` (Vender/Fechamento) — é "meu" caixa, não "um" caixa qualquer. `SaleService.create` passou a chamar `requireOpen(tenantId, operator.id)`: uma venda só entra na sessão que o próprio operador abriu (antes, com múltiplos caixas, podia cair em qualquer sessão aberta do tenant). Badge "Caixa #N" no cabeçalho de Vender/Fechamento (`cashSessionBadgeLabel`) mostra o `registerNumber` físico quando `tenant.registerCount > 1`, senão mantém o `sequence` ordinal de sempre (zero mudança visual pro caso comum). Fechamento ganhou um seletor (Admin only) pra escolher qual caixa fechar quando o próprio Admin não abriu nenhum mas há outros abertos (`GET /cash-sessions/registers` + `GET /cash-sessions/:id`). Dashboard não precisou de mudança — já agregava por tenant/data, nunca por sessão. Jest cobre `getCurrent` (tenant-wide) vs `getMine` (só do operador) separadamente

## Sprint 10 — Relatórios (concluída — decisão de 2026-09-14)

Visão "olhar pra trás" que o Dashboard (Épico 7) não cobre — período
escolhido pelo usuário e comparação com o período anterior, em vez de só
"hoje". Esboçada no protótipo
(https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10, tela
"Relatórios" nos 3 breakpoints). HUs em `docs/scrum/BACKLOG.md` Épico 12,
detalhe do plano em `docs/scrum/SPRINTS.md`.

- [x] 12.1-12.7 (endpoint único, como o Dashboard fez com 7.1-7.3) — `GET
/reports/summary?period=today|week|month|custom&from&to` (`ReportsService.summary`,
      só `ADMIN`); período resolvido no fuso da loja reaproveitando
      `common/utils/time-zone.ts` (semana = 7 dias corridos, mês = 30 dias
      corridos, não mês-calendário — mesmo raciocínio do Dashboard pra
      "semana"); `period=custom` exige `from`/`to` (400 `VALIDATION` via
      `.refine` no schema se faltar). Resposta cobre: total + `salesCount`;
      `previousPeriod` (mesmo tamanho, imediatamente anterior; `deltaPercent`
      `null` quando o período anterior não teve venda, evita divisão por
      zero); `byPaymentMethod`; `days` (um por dia no intervalo, zero-filled,
      pro gráfico); `topProducts` (top 5, mesma lógica do Dashboard);
      `byOperator` (soma + `percent` do total, por operador); `stagnantProducts`
      (produtos ativos com ≤2 unidades vendidas no período, **incluindo quem
      vendeu 0** — parte da lista de produtos, não das vendas, senão quem não
      vendeu nada nunca apareceria). 14 testes Jest cobrindo cada peça
      isoladamente. Front: `/reports` (nav só `ADMIN`, ícone novo
      `ReportsIcon`), pills de período + inputs de data pro personalizado,
      reaproveita `TotalCard`/`StatTile`/`WeekChart`/`TopProductRow` do
      Dashboard/Fechamento; `OperatorSalesRow` e `StagnantProductRow` novos.
      `WeekChart` ganhou um ajuste (legenda por dia só até 10 colunas — o mês
      de 30 dias ficaria ilegível; Dashboard, sempre 7 dias, não muda).
- [x] Fix (2026-09-16): legenda do eixo X sobrepondo texto no mobile em
      períodos densos (`WeekChart` com mês/30 dias, `HourChart` com 24
      horas) — `isSparseLabelIndex()` (`lib/utils/chart.ts`) escolhe ~6
      rótulos espaçados pra mobile, o resto só aparece a partir do `md`; o
      valor de cada barra some no mobile denso e vira um chip fixo acima do
      gráfico com o maior valor do período ("Maior venda: ..."). `MonthChart`
      (12 colunas) não precisou de ajuste.

## Backlog P2 (sem sprint fixa ainda)

- [ ] Sessão com renovação deslizante por inatividade (hoje o JWT expira 12h fixas após o login — decisão da Sprint 1)
- [ ] Carregar Poppins/Inter via `next/font` (hoje `--font-heading`/`--font-body` caem no fallback do sistema)

- [ ] Storybook para `components/ui` e `components/pos`
- [ ] Hard-delete de dado pessoal sob pedido (LGPD) — ver `docs/specs/08-seguranca.md` § 11
- [ ] WAF/CDN na frente da VPS — reavaliar se o tráfego crescer
- [ ] 2FA para Administrador — reavaliar se o perfil de cliente mudar
