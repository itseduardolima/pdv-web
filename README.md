# pdv-web

Sistema PDV web, multi-tenant e white-label, para pequenos mercados
("mercadinhos") sem sistema informatizado hoje.

> **Trabalhando neste repositório?** Leia [`TODO.md`](./TODO.md) primeiro
> (o que já foi feito e o que falta) e depois [`CLAUDE.md`](./CLAUDE.md)
> (contexto de produto, arquitetura, e onde estão as specs em
> [`docs/specs/`](./docs/specs)). Este README é só o "como rodar".

Protótipo de design (referência visual, não código):
https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10 (e o
repositório irmão `../pdv-mercadinho`).

## Stack

Monorepo pnpm + Turborepo — `apps/web` (Next.js) + `apps/api` (NestJS) +
`packages/shared` (schemas Zod, contrato único de API). Detalhe completo em
[`docs/specs/02-tecnologias.md`](./docs/specs/02-tecnologias.md).

## Pré-requisitos

- Node.js ≥ 22
- pnpm ≥ 11 (`corepack enable` já resolve a versão certa via `packageManager` do `package.json`)
- Docker + Docker Compose (para Postgres e MinIO locais — não precisa instalar nenhum dos dois na máquina)

## Primeira vez rodando localmente

```bash
# 1. instalar dependências do monorepo inteiro
pnpm install

# 2. subir Postgres e MinIO locais (overlay de dev publica as portas no host)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres minio

# 3. copiar os .env de exemplo
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# os valores default do apps/api/.env.example já combinam com o compose de dev acima —
# só troque SESSION_SECRET por um valor gerado (openssl rand -hex 32)

# 4. gerar o client do Prisma e aplicar as migrations
pnpm --filter api db:generate
pnpm --filter api db:migrate

# 5. popular um tenant de demonstração (loja "demo", admin com PIN 1234)
pnpm --filter api db:seed

# 6. subir os dois apps em paralelo
pnpm dev
```

- `apps/web` fica em http://demo.app.localhost:3000 (login: Administrador,
  PIN 1234; Rafael, PIN 2222) — o tenant é resolvido
  pelo subdomínio (`<slug>.APP_BASE_DOMAIN`), então `localhost:3000` puro
  mostra "Loja não encontrada". `*.localhost` resolve para 127.0.0.1 sem
  configurar `/etc/hosts` no Chrome, Firefox e macOS.
- `apps/api` fica em http://localhost:3001 (Swagger em `/docs`; toda outra
  rota exige o header `x-tenant-host: demo.app.localhost` — ver
  `apps/api/docs/SPEC.md`)
- Console do MinIO em http://localhost:9001 (login: `STORAGE_ACCESS_KEY` /
  `STORAGE_SECRET_KEY` do `.env`)

## Comandos do dia a dia

```bash
pnpm dev                        # turbo run dev — web + api em paralelo
pnpm build                      # build de tudo
pnpm lint                       # lint de tudo
pnpm typecheck                  # typecheck de tudo — rodar antes de todo commit
pnpm test                       # Jest — testes unitários do apps/api
pnpm --filter web cy:run        # Cypress component tests
pnpm --filter web cy:run:e2e    # Cypress E2E (precisa da API rodando)
pnpm --filter api db:studio     # Prisma Studio (inspecionar o banco local)
pnpm --filter api db:migrate    # nova migration em desenvolvimento
```

## Rodando como vai rodar na VPS (produção)

```bash
cp .env.example .env   # preencher com valores reais, nunca os default de exemplo
docker compose up -d --build
```

Sobe `web` + `api` + `postgres` + `minio` + `caddy` (TLS automático) — sem
publicar porta de banco/storage para fora da rede interna do Docker. Ver
[`docs/specs/01-arquitetura.md`](./docs/specs/01-arquitetura.md) § Ambientes
e deploy, e o runbook de operação em
[`docs/specs/09-operacao.md`](./docs/specs/09-operacao.md) para monitoramento,
backup/restore e o que fazer quando algo dá errado.

## Onde está o quê

```
apps/web/        Next.js — frontend/PWA, nunca acessa banco direto
apps/api/         NestJS — toda regra de negócio, Prisma/PostgreSQL
packages/shared/  schemas Zod compartilhados (contrato de API)
docs/specs/       arquitetura, regras de negócio, padrões, segurança, operação
docs/scrum/       backlog e plano de sprints
TODO.md           checklist vivo do que está feito e o que falta
```
