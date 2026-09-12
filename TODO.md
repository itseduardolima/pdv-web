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

- Extra pós-Sprint 5 (2026-09-12): troco em venda em Dinheiro —
  `amountReceivedCents`/`changeCents` na venda, calculados e validados na
  API (`INSUFFICIENT_CASH`), campo "Valor recebido" no carrinho, troco na
  confirmação e no histórico. Spec 03 § Venda atualizada.
- Sprint 5 concluída no código (9.1, 1.4, E2E, imagens Docker buildadas).
  9.2 (TLS) fica pendente de validação com domínio real no primeiro deploy.
  Sprint 6 concluída (Operadores 6.1 → 6.7 + Dashboard 7.1 → 7.3).
  Próximo: Sprint 7 — Offline-first (PWA).

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
- [ ] Web: e-mail no cadastro de operador (PIN opcional quando há e-mail), "Esqueci meu PIN" no Login, tela `/set-pin?token=`, "Reenviar link" na edição (reset manual só sem e-mail), indicador "primeiro acesso pendente" na lista; E2E

## Sprint 7 — Offline-first (PWA)

- [ ] 8.1 — Cache de catálogo offline (Dexie)
- [ ] 8.2 — Fila de vendas offline + sincronização idempotente — `POST /sales` já é idempotente por `uuid` (gerado no carrinho); falta `POST /sales/sync` em lote e a fila Dexie
- [ ] 8.3 — PWA instalável com identidade do tenant
  - [ ] Favicon: usar `~/Downloads/favicon.ico` (256×256, PNG dentro de .ico) como favicon **default** da plataforma em `apps/web/src/app/`; quando o tenant tiver logo, o ícone passa a ser o logo dele (white-label, spec 06/07)
- [ ] 9.3 — Backup diário do banco
- [ ] 9.4 — Deploy automático via CI

## Backlog P2 (sem sprint fixa ainda)

- [ ] Sessão com renovação deslizante por inatividade (hoje o JWT expira 12h fixas após o login — decisão da Sprint 1)
- [ ] Carregar Poppins/Inter via `next/font` (hoje `--font-heading`/`--font-body` caem no fallback do sistema)

- [ ] Storybook para `components/ui` e `components/pos`
- [ ] Hard-delete de dado pessoal sob pedido (LGPD) — ver `docs/specs/08-seguranca.md` § 11
- [ ] WAF/CDN na frente da VPS — reavaliar se o tráfego crescer
- [ ] 2FA para Administrador — reavaliar se o perfil de cliente mudar
