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

- Sprint 6 concluída (Operadores 6.1 → 6.7 + Dashboard 7.1 → 7.3).
- Épico 11 (Configurações da Loja) documentado e inserido como **Sprint 7** —
  prioridade P1, bloqueia white-label completo (hoje o admin não consegue
  trocar nome/logo/cor sem editar o banco ou refazer seed).
- Próximo: Sprint 7 — Configurações da Loja (HU 11.1 → 11.5, 13 pts).

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

## Backlog P2 (sem sprint fixa ainda)

- [ ] Sessão com renovação deslizante por inatividade (hoje o JWT expira 12h fixas após o login — decisão da Sprint 1)
- [ ] Carregar Poppins/Inter via `next/font` (hoje `--font-heading`/`--font-body` caem no fallback do sistema)

- [ ] Storybook para `components/ui` e `components/pos`
- [ ] Hard-delete de dado pessoal sob pedido (LGPD) — ver `docs/specs/08-seguranca.md` § 11
- [ ] WAF/CDN na frente da VPS — reavaliar se o tráfego crescer
- [ ] 2FA para Administrador — reavaliar se o perfil de cliente mudar
