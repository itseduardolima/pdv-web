# pdv-web

> **Leia [`TODO.md`](./TODO.md) antes de qualquer outra coisa.** É o
> checklist vivo do projeto — o que já está feito e o que falta, por
> sprint. Toda sessão que trabalhar aqui lê esse arquivo primeiro e o
> atualiza (marca `[x]`, adiciona linha nova) antes de terminar. Sem isso,
> trabalho duplicado ou fora de ordem é praticamente garantido.

Sistema PDV web, multi-tenant e white-label, para pequenos mercados
("mercadinhos") sem sistema informatizado hoje. Implementação real do
protótipo de design validado (Claude Artifact) do repositório irmão
`../pdv-mercadinho` (mockup estático, não código de produção — não copiar
HTML dele, ele é referência visual, ver `docs/specs/`).

- **Protótipo clicável publicado**: https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10
  — referência visual definitiva de todas as telas, nos 3 breakpoints
  (Desktop/Tablet/Celular). Usar para tirar dúvida de layout/estado que os
  specs não cobrem em detalhe; o design system em código está em
  `apps/web/docs/DESIGN_SYSTEM.md`.

## Antes de qualquer alteração, leia

Todo o contexto de produto, arquitetura e decisão já tomada está em
`docs/specs/`, nesta ordem de leitura:

1. `docs/specs/00-visao-geral.md` — o que é, por quê, o que é fora de escopo
2. `docs/specs/01-arquitetura.md` — como as peças se encaixam (Next.js
   frontend + NestJS backend em monorepo, multi-tenant, offline-first no
   caixa, deploy self-hosted em VPS)
3. `docs/specs/02-tecnologias.md` — stack escolhida e por quê
4. `docs/specs/03-regras-negocio.md` — **fonte da verdade de comportamento**
   (papéis, caixa, venda, produtos, operadores) — qualquer feature nova
   precisa ser consistente com isso ou precisa atualizar este arquivo junto
5. `docs/specs/04-padroes-codigo.md` — estrutura de pastas, nomenclatura,
   convenções de commit e teste
6. `docs/specs/05-componentizacao.md` — como reusar componentes entre
   desktop/tablet/celular sem duplicar
7. `docs/specs/06-design-system-temas.md` — tokens visuais e como o tema
   troca por tenant
8. `docs/specs/07-multitenant-whitelabel.md` — isolamento de dado e como
   revender para outro mercado
9. `docs/specs/08-seguranca.md` — checklist de segurança (vazamento entre
   tenants, XSS, CSRF, PIN/rate-limit, upload, segredos, LGPD) — consultar
   antes de tocar em auth, upload, ou qualquer query entre tenants
10. `docs/specs/09-operacao.md` — runbook (health check, monitoramento,
    logs, backup/restore, deploy/rollback, incidentes) — consultar antes de
    tocar em deploy, migration em produção, ou qualquer coisa da VPS

Planejamento de execução (Scrum) está em `docs/scrum/`:
`BACKLOG.md` (épicos e histórias de usuário, com critério de aceite e
pontos) e `SPRINTS.md` (ordem das sprints e por que começar por
Tenant+Auth). O **estado atual** (o que já foi feito) é `TODO.md`, na raiz
— leia esse primeiro, ele referencia o número da HU aqui do backlog.

Specs específicas de implementação de cada app (endpoints, rotas, tokens de
design em detalhe) vivem dentro do próprio app, não na raiz:

- `apps/web/docs/SPEC.md` — rotas, estrutura de código, client HTTP, offline, PWA
- `apps/web/docs/DESIGN_SYSTEM.md` — tokens completos (cor, tipografia,
  espaçamento, raio, sombra), mapeamento para Tailwind, do's/don'ts —
  baseado no design system oficial **Aaply**
  (https://styles.refero.design/style/357e6fee-72db-40cf-b858-254b802018bd)
- `apps/api/docs/SPEC.md` — módulos, endpoints, convenções de DTO/erro/teste

Se uma tarefa contradiz algo escrito em `docs/specs/`, o spec vence — ou a
tarefa é, na verdade, "atualizar o spec" (avisar o usuário disso).

## Regras que não estão em nenhum spec, mas valem sempre

- **Nunca hardcode nome de mercado, cor de marca ou logo em componente.**
  Isso é o requisito central do produto (white-label) — ver spec 06 e 07.
  Se você está prestes a escrever `#e6e51e` ou `"Mercadinho PDV"` fora de
  `styles/theme.css` / seed de tenant default, pare e use o token/tenant.
- **Toda query de banco passa por um `Repository` do NestJS (`apps/api/src/modules/*/*.repository.ts`)
  com `tenantId` obrigatório.** Nunca escrever uma query Prisma direto num
  `Controller`, e nunca acessar banco a partir de `apps/web`.
- **`page.tsx` é só view.** Três tipos de hook, nunca misturar: (1) hook de
  página, colocado ao lado do `page.tsx` (`use-<página>.ts`) — só
  orquestração/estado local, nunca busca dado sozinho; (2) hook de dado em
  `hooks/queries/`, sempre TanStack Query — é quem chama a API; (3) hook
  compartilhado não-query em `hooks/` (`useCart`, etc.). E nenhuma função
  solta dentro de um componente: função pura vai para `lib/utils/`,
  reutilizável. Ver `04-padroes-codigo.md` § Separação de lógica e UI.
- **Toda regra e toda mensagem de validação vêm do backend — sempre, sem
  exceção.** Não é só regra de negócio sensível (permissão de admin,
  imutabilidade de caixa fechado, estoque não-negativo): até validação de
  campo simples (nome obrigatório, PIN de 4 dígitos) é decidida e respondida
  pela API. O frontend nunca roda `.parse()`/`.safeParse()` de um schema
  para bloquear um submit, nunca escreve sua própria mensagem de erro — só
  exibe o que a API devolveu. Ver `04-padroes-codigo.md` § Formulários e
  `apps/web/docs/DESIGN_SYSTEM.md` § Validação e feedback.
- **Um componente por conceito, responsivo — não um componente por
  breakpoint.** Ver spec 05.
- **Código em inglês, poucos comentários (em português), commits
  Conventional Commits em inglês.** Vocabulário fixo de domínio
  (`Operator`, `Product`, `CashSession`, `Sale`, `PaymentMethod`) na seção
  Idioma de [04-padroes-codigo](./docs/specs/04-padroes-codigo.md). Texto
  exibido ao usuário continua em português.
- **Construir por etapas.** Um módulo/feature por vez, validado (typecheck +
  testes) antes de começar o próximo — não scaffoldar vários módulos de uma
  vez.
- **Toda regra de negócio nova em `apps/api` precisa de teste unitário Jest
  no `Service` correspondente (`Repository` mockado) antes de ser
  considerada pronta** — não é opcional, é a forma de provar que a regra em
  [03-regras-negocio](./docs/specs/03-regras-negocio.md) está implementada
  corretamente. Ver [04-padroes-codigo](./docs/specs/04-padroes-codigo.md).

## Stack e topologia (resumo — detalhe em docs/specs)

Monorepo pnpm + Turborepo: `apps/web` (Next.js, só frontend/PWA) e `apps/api`
(**NestJS**, toda regra de negócio e acesso a dado via Prisma/PostgreSQL).
`apps/web` nunca acessa banco direto — sempre chama `apps/api` por HTTP.
Hospedagem: **VPS própria (Hostinger)**, tudo via Docker Compose
(web + api + PostgreSQL + MinIO + Nginx/Caddy) — sem PaaS/serviço gerenciado
de terceiro (nada de Vercel, Supabase, Railway). Ver
[01-arquitetura](./docs/specs/01-arquitetura.md).

## Comandos (preencher conforme o projeto for scaffolded)

```bash
pnpm install
pnpm dev              # turbo run dev (web + api em paralelo)
pnpm build
pnpm lint
pnpm typecheck
pnpm test             # Jest — apps/api/src/modules/**/*.spec.ts (testes unitários do backend)
pnpm --filter web cy:run        # Cypress — component tests (apps/web/src/components/**/*.cy.tsx)
pnpm --filter web cy:run:e2e    # Cypress E2E — apps/web contra api real
pnpm --filter api db:migrate   # prisma migrate dev
pnpm --filter api db:studio    # prisma studio
docker compose up -d --build   # sobe web + api + postgres + minio na VPS
```

## Estado atual do projeto

Sprint 0 concluída e Sprint 1 em andamento. Pronto: monorepo pnpm +
Turborepo, `packages/shared` (schemas Zod), `apps/api` (NestJS com infra de
tenant/auth/erros, migration inicial e o **módulo `tenant`** — resolução por
host com cache e `GET /tenant/current`), `apps/web` (Next.js + Tailwind com
tema do tenant aplicado no layout raiz, `api-client`, Cypress configurado),
`docker-compose.yml` + `Caddyfile`, CI. Próximo passo: módulo `auth` na API
(ver ordem em `apps/api/docs/SPEC.md` e o estado em `TODO.md`).
