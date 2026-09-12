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

- Sprint 2 concluída (produtos + validação/feedback + seed de tenant).
  Próximo: Sprint 3 — caixa (4.1 → 4.4), foto de produto (3.4) e excluir (3.5).

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

- [ ] 4.1 — Abrir caixa
- [ ] 4.2 — Bloquear ações sem caixa aberto — inclui trocar o redirect de `/` (hoje vai para `/products`) para `/open-register`
- [ ] 4.3 — Fechar caixa com totais por forma de pagamento
- [ ] 4.4 — Histórico de vendas na tela de Fechamento
- [ ] 3.4 — Upload de foto do produto (MinIO) — `PhotoUploadBox` ainda não existe; o painel esquerdo do form de produto só tem o código de barras
- [ ] 3.5 — Excluir produto (soft-delete)

## Sprint 4 — Vender (core do produto)

- [ ] 5.1 — Montar carrinho
- [ ] 5.2 — Finalizar venda (Dinheiro/Cartão/Pix)
- [ ] 5.3 — Bloqueio de estoque insuficiente
- [ ] 5.4 — Tela de Venda Confirmada
- [ ] 5.5 — Cancelar carrinho

## Sprint 5 — Deploy do primeiro cliente real

- [ ] 9.1 — `docker compose up` completo, documentado
- [ ] 9.2 — HTTPS automático (Caddy + Let's Encrypt)
- [ ] 1.4 — Row-Level Security no Postgres
- [ ] Testes E2E Cypress dos fluxos críticos (login → abrir caixa → vender → fechar caixa)

## Sprint 6 — Operadores (gestão completa) + Dashboard

- [ ] 6.1 — Listar operadores (ativos e inativos)
- [ ] 6.2 — Criar operador
- [ ] 6.3 — Resetar PIN de operador
- [ ] 6.4 — Ativar/inativar operador
- [ ] 6.5 — Regra do último Administrador
- [ ] 6.6 — Upload de foto do operador
- [ ] 6.7 — Excluir operador (soft-delete)
- [ ] 7.1 — Dashboard: total do dia por forma de pagamento
- [ ] 7.2 — Dashboard: mais vendidos hoje
- [ ] 7.3 — Dashboard: gráfico da semana

## Sprint 7 — Offline-first (PWA)

- [ ] 8.1 — Cache de catálogo offline (Dexie)
- [ ] 8.2 — Fila de vendas offline + sincronização idempotente
- [ ] 8.3 — PWA instalável com identidade do tenant
- [ ] 9.3 — Backup diário do banco
- [ ] 9.4 — Deploy automático via CI

## Backlog P2 (sem sprint fixa ainda)

- [ ] Sessão com renovação deslizante por inatividade (hoje o JWT expira 12h fixas após o login — decisão da Sprint 1)
- [ ] Carregar Poppins/Inter via `next/font` (hoje `--font-heading`/`--font-body` caem no fallback do sistema)

- [ ] Storybook para `components/ui` e `components/pos`
- [ ] Hard-delete de dado pessoal sob pedido (LGPD) — ver `docs/specs/08-seguranca.md` § 11
- [ ] WAF/CDN na frente da VPS — reavaliar se o tráfego crescer
- [ ] 2FA para Administrador — reavaliar se o perfil de cliente mudar
