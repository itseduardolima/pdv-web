# pdv-web

Sistema PDV web, multi-tenant e white-label, para pequenos mercados
("mercadinhos") sem sistema informatizado hoje. Implementação real do
protótipo de design validado (Claude Artifact) do repositório irmão
`../pdv-mercadinho` (mockup estático, não código de produção — não copiar
HTML dele, ele é referência visual, ver `docs/specs/`).

## Antes de qualquer alteração, leia

Todo o contexto de produto, arquitetura e decisão já tomada está em
`docs/specs/`, nesta ordem de leitura:

1. `docs/specs/00-visao-geral.md` — o que é, por quê, o que é fora de escopo
2. `docs/specs/01-arquitetura.md` — como as peças se encaixam (Next.js
   full-stack, multi-tenant, offline-first no caixa)
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
- **Regra de negócio sensível (permissão de admin, imutabilidade de caixa
  fechado, estoque não-negativo) é validada no servidor, não só escondida na
  UI.** Ver spec 03.
- **Um componente por conceito, responsivo — não um componente por
  breakpoint.** Ver spec 05.
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

Fase de especificação concluída (`docs/specs/`). Scaffold de código
(monorepo `apps/web` Next.js + `apps/api` NestJS + Prisma + Docker Compose)
ainda não iniciado — próximo passo natural é montar o workspace pnpm/Turborepo
seguindo a estrutura de `04-padroes-codigo.md` e o schema inicial descrito em
`07-multitenant-whitelabel.md`.
