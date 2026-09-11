# Arquitetura

## Visão em alto nível

Monorepo com frontend e backend separados: **Next.js** (frontend, SSR + PWA)
consumindo uma **API NestJS** dedicada (HTTP/REST). Não é Next.js full-stack
— a lógica de negócio e o acesso a dado vivem inteiramente no NestJS.

```
┌──────────────────────────────────────────────────────────┐
│                     Browser / PWA                          │
│  Next.js App Router (RSC + client islands)                 │
│  - Service Worker (cache de assets + fila offline)          │
│  - IndexedDB (Dexie) — cart em progresso, fila de vendas    │
│    pendentes de sincronizar                                 │
└───────────────┬──────────────────────────────────────────┘
                │ HTTPS (REST, JSON)
┌───────────────▼──────────────────────────────────────────┐
│                     API — NestJS                            │
│  - TenantMiddleware: resolve tenant pelo host/subdomínio     │
│  - AuthGuard: sessão do operador (PIN), escopada ao tenant   │
│  - Modules por domínio: Venda, Caixa, Produto, Operador,      │
│    Tenant (ver 04-padroes-codigo.md)                         │
│  - Regras de negócio nos Services (ver 03-regras-negocio.md) │
└───────────────┬──────────────────────────────────────────┘
                │ Prisma Client
┌───────────────▼──────────────────────────────────────────┐
│                  PostgreSQL (multi-tenant)                  │
│  Toda tabela de domínio tem tenant_id; isolado por RLS       │
│  ou por filtro obrigatório na camada de repositório          │
└──────────────────────────────────────────────────────────┘
```

## Por que NestJS separado (e não Next.js full-stack)

Decisão explícita do projeto: o backend é um serviço NestJS próprio, não
Route Handlers/Server Actions do Next. Motivos:

- **Fronteira de domínio explícita.** Módulos, Controllers, Services e DTOs
  do Nest forçam a separação entre "regra de negócio" e "camada HTTP" por
  convenção da própria framework — não depende de disciplina manual de time
  como seria dentro de `app/api` do Next.
- **Testabilidade.** Injeção de dependência do Nest facilita testar um
  `Service` isolado (mockando `Repository`), sem simular request HTTP.
- **Evolução futura sem re-arquitetura.** Se o produto crescer (webhook de
  sincronização fiscal, worker de fila, integração com adquirente de
  cartão), isso entra como um novo Module ou um microserviço Nest, sem
  precisar arrancar lógica de dentro de rotas Next depois.
- **Frontend fica mais simples.** Next.js atua só como camada de
  apresentação (SSR das telas + PWA/offline) e consome a API por HTTP — o
  mesmo contrato de API pode, no futuro, alimentar outro cliente (app nativo,
  painel interno) sem duplicar regra de negócio.

Trade-off aceito: dois deploys em vez de um (ver "Ambientes e deploy" abaixo)
— aceitável porque o ganho de fronteira clara vale mais do que a simplicidade
de deploy único, dado que este produto pretende crescer em regras de negócio
(multi-tenant, permissões, offline sync).

## Estrutura de monorepo

```
apps/
  web/            # Next.js — frontend (SSR das telas, PWA, chama a API)
  api/             # NestJS — backend (toda regra de negócio e acesso a dado)
packages/
  shared/          # tipos e schemas Zod compartilhados entre web e api
                   # (contrato de request/response da API — fonte única da verdade)
  config/          # tsconfig, eslint config compartilhados
```

Gerenciado com **pnpm workspaces + Turborepo** (builds/lint/test em paralelo,
cache entre apps). Ver estrutura interna de `apps/api` em
[04-padroes-codigo](./04-padroes-codigo.md).

## Multi-tenant: como um tenant é resolvido

1. Cada tenant tem um `slug` (ex: `mercadinho-da-karol`) e opcionalmente um
   domínio próprio (`caixa.mercadinhodakarol.com.br`).
2. Um `TenantMiddleware` no NestJS lê o host da requisição (repassado pelo
   Next no header, já que o Next é quem recebe a requisição do browser antes
   de proxiar/chamar a API — ver "Como o Next fala com a API" abaixo),
   resolve o tenant (cache em memória + fallback no banco) e anexa
   `request.tenantId` via `AsyncLocalStorage` ou request-scoped provider.
3. Toda query ao banco passa por um `Repository` (Nest provider), que
   **sempre** filtra por `tenantId` — nunca é opcional, nunca é passado
   manualmente pelo Controller.
4. Autenticação (sessão do operador) é escopada ao tenant: o mesmo PIN em
   dois tenants diferentes são contas diferentes.

Ver detalhamento em [07-multitenant-whitelabel](./07-multitenant-whitelabel.md).

## Como o Next fala com a API

- O browser sempre acessa o Next (é ele que resolve o host/subdomínio do
  tenant primeiro, para SSR e para servir o tema certo — ver
  [06-design-system-temas](./06-design-system-temas.md)).
- O Next repassa o host original (ou o `tenantId` já resolvido, se resolver
  isso também no lado do Next para SSR) para a API via header interno
  (`x-tenant-id` ou `x-forwarded-host`) em toda chamada — a API nunca confia
  em header vindo direto do browser sem revalidar contra a tabela de tenant.
- Sessão do operador: cookie httpOnly emitido pela API, mas seguindo o
  domínio do Next (ou um domínio compartilhado) para que o browser o envie
  de volta — detalhe a validar na implementação (pode exigir a API e o Next
  compartilharem domínio-pai, ex: `app.pdv.com` e `api.pdv.com`, cookie com
  `Domain=.pdv.com`).

## Offline-first no caixa (PWA)

O ponto de venda não pode parar se a internet cair. Estratégia:

- **Catálogo de produtos**: cacheado no IndexedDB, sincronizado a cada login e
  em background (`stale-while-revalidate`). Vender não depende de rede.
- **Venda**: ao finalizar, a venda é gravada localmente (IndexedDB) com um
  UUID gerado no cliente e status `pending_sync`, e a UI já responde como
  concluída ("Venda Confirmada"). Um worker em background tenta enviar para a
  API; se falhar, tenta de novo com backoff. Isso evita perder venda por
  falha de rede no meio do checkout.
- **Abertura/Fechamento de caixa**: idealmente online (é um evento raro), mas
  o fluxo de abertura também cai na fila offline se necessário — a API é a
  fonte da verdade final quando sincroniza.
- **Conflitos**: como cada venda tem UUID gerado no cliente, o endpoint de
  sincronização da API faz upsert idempotente — reenvio duplicado nunca
  duplica a venda.

## Ambientes e deploy — VPS própria (Hostinger), tudo self-hosted

Decisão explícita do projeto: nada de PaaS/serviço gerenciado terceirizado
(sem Vercel, sem Supabase, sem Railway). Tudo roda numa VPS (Hostinger),
orquestrado por **Docker Compose** — um único servidor concentra frontend,
backend, banco e storage. Motivo: custo previsível (uma VPS fixa, não
cobrança por uso) e controle total do ambiente, adequado ao estágio do
produto (poucos tenants, orçamento apertado de quem está começando a
revender o sistema).

```
VPS (Hostinger)
├── Nginx (ou Caddy)         — reverse proxy + TLS (Let's Encrypt), roteia
│                              por host: app.dominio.com → web, api.dominio.com → api
├── apps/web (Next.js)        — container, porta interna 3000
├── apps/api (NestJS)         — container, porta interna 3001
├── PostgreSQL                — container, volume persistente
└── MinIO                     — container, storage S3-compatible self-hosted
                                 (fotos de produto/operador, logo do tenant)
```

- **Frontend (`apps/web`)** e **backend (`apps/api`)**: cada um sua imagem
  Docker, buildada no CI e enviada para a VPS (ou buildada direto na VPS via
  `docker compose up --build` num deploy simples inicial — evoluir para
  registry de imagem quando o processo de deploy pedir mais confiabilidade).
- **Banco**: PostgreSQL em container na própria VPS, com volume Docker
  persistente e backup agendado (`pg_dump` diário para um destino externo —
  não depender só do disco da VPS).
- **Storage de imagens**: **MinIO** (S3-compatible, self-hosted) em
  container — mesma API que Cloudflare R2/S3, então o código da API
  (`@aws-sdk/client-s3` ou equivalente) não muda se um dia migrar para um
  provedor gerenciado; só troca endpoint/credenciais. Nunca base64 no banco.
- **Reverse proxy e TLS**: Nginx ou Caddy na própria VPS terminando HTTPS
  (Caddy é mais simples para renovar certificado Let's Encrypt automático).
- **Variáveis de ambiente da API**: `DATABASE_URL` (apontando pro Postgres
  do compose), `SESSION_SECRET`, `STORAGE_ENDPOINT`/`STORAGE_*` (MinIO),
  `CORS_ORIGIN` (URL do `apps/web`).
  Configuração de tema/nome por tenant **não é env var** — é dado no banco
  (ver 06 e 07), porque numa mesma instalação vários tenants coexistem.
- **CI/CD**: GitHub Actions builda e testa em todo PR; deploy na branch
  principal via SSH na VPS (`docker compose pull && docker compose up -d` ou
  build remoto) — manter simples enquanto for 1 VPS só; não introduzir
  Kubernetes ou orquestração multi-nó sem um motivo real de escala.
- **Escala futura**: se um dia a carga justificar, o mesmo `docker-compose.yml`
  serve de base para separar banco/storage num host próprio ou migrar para
  um provedor gerenciado — a aplicação não fica presa a MinIO/Postgres em
  container por design (é tudo API padrão S3/Postgres), só a topologia de
  deploy muda.

## Diretórios (visão de arquitetura, detalhe de código em 04)

```
apps/
  web/
    src/
      app/            # rotas Next (App Router)
      components/     # UI (ver 05-componentizacao.md)
      lib/
      styles/         # tokens de tema (ver 06)
  api/
    src/
      modules/
        venda/
        caixa/
        produto/
        operador/
        tenant/
        auth/
      common/         # guards, middlewares, decorators, filters
      prisma/         # PrismaService
    prisma/
      schema.prisma
packages/
  shared/
    src/
      schemas/        # Zod — contrato de API, usado por web e api
docs/
  specs/              # este diretório
```
