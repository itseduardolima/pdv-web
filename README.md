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
- `apps/api` fica em http://localhost:3001 — Swagger em `/docs`, já com o
  header `x-tenant-host` da loja demo preenchido; faça `POST /auth/login`
  por lá e as rotas com cadeado funcionam (ver `apps/api/docs/SPEC.md`)
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

## Deploy na VPS (produção)

Pré-requisitos na VPS: Docker + Docker Compose, portas 80 e 443 livres, e o
DNS apontando para o IP da VPS:

| Registro | Nome                      | Uso                                           |
| -------- | ------------------------- | --------------------------------------------- |
| A        | `app.seudominio.com.br`   | web (loja padrão)                             |
| A        | `*.app.seudominio.com.br` | web — um subdomínio por loja (`karol.app...`) |
| A        | `api.seudominio.com.br`   | API                                           |
| A        | `media.seudominio.com.br` | fotos/logos (MinIO)                           |

```bash
git clone <repo> pdv-web && cd pdv-web
cp .env.example .env            # preencher TUDO com valores reais
./scripts/deploy-check.sh       # barra .env ausente ou com placeholder
docker compose up -d --build    # web + api + postgres + minio + caddy
docker compose logs -f api      # aguardar "Nest application successfully started"

# primeira loja (ver docs/specs/07-multitenant-whitelabel.md § Onboarding)
docker compose exec -e SEED_TENANT_SLUG=karol -e SEED_TENANT_NAME='Mercadinho da Karol' \
  -e SEED_ADMIN_NAME=Karol -e SEED_ADMIN_PIN=4321 api node dist/seed/prisma/seed.js
```

Depois disso `https://karol.app.seudominio.com.br` abre com certificado
Let's Encrypt emitido na primeira visita (Caddy `on_demand_tls`: só emite
para hosts que a API reconhece como loja, via `GET /tenant/tls-check`). Um
domínio próprio do cliente funciona do mesmo jeito: CNAME para a VPS +
`SEED_TENANT_DOMAIN=caixa.mercadinho.com.br` no seed.

O que o compose garante: Postgres e MinIO nunca expostos fora da rede
interna; a API conecta ao banco como usuário **sem superusuário**
(`APP_DB_USER`, criado por `infra/postgres/init-app-role.sh` na primeira
subida), condição para a Row-Level Security valer; migrations rodam no
`CMD` da API antes de subir. Monitoramento, backup/restore e rollback: ver
[`docs/specs/09-operacao.md`](./docs/specs/09-operacao.md).

Atualizar uma versão: `git pull && ./scripts/deploy-check.sh && docker compose up -d --build`.
Ambiente local continua em `docker-compose.dev.yml` (defaults `*.localhost`
e senhas triviais — nunca use esses defaults na VPS).

## Onde está o quê

```
apps/web/        Next.js — frontend/PWA, nunca acessa banco direto
apps/api/         NestJS — toda regra de negócio, Prisma/PostgreSQL
packages/shared/  schemas Zod compartilhados (contrato de API)
docs/specs/       arquitetura, regras de negócio, padrões, segurança, operação
docs/scrum/       backlog e plano de sprints
TODO.md           checklist vivo do que está feito e o que falta
```
