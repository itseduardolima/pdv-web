# Arquitetura

## Visão em alto nível

```
┌──────────────────────────────────────────────────────────┐
│                     Browser / PWA                          │
│  Next.js App Router (RSC + client islands)                 │
│  - Service Worker (cache de assets + fila offline)          │
│  - IndexedDB (Dexie) — cart em progresso, fila de vendas    │
│    pendentes de sincronizar                                 │
└───────────────┬──────────────────────────────────────────┘
                │ HTTPS (fetch / Server Actions)
┌───────────────▼──────────────────────────────────────────┐
│              Next.js Route Handlers / Server Actions        │
│  - Resolução de tenant (subdomínio/domínio → tenant_id)     │
│  - Auth de sessão (cookie httpOnly, PIN de operador)         │
│  - Regras de negócio (ver 03-regras-negocio.md)              │
└───────────────┬──────────────────────────────────────────┘
                │ Prisma Client
┌───────────────▼──────────────────────────────────────────┐
│                  PostgreSQL (multi-tenant)                  │
│  Toda tabela de domínio tem tenant_id; isolado por RLS       │
│  ou por filtro obrigatório na camada de repositório          │
└──────────────────────────────────────────────────────────┘
```

## Por que Next.js full-stack (sem backend separado)

Time pequeno, escopo de v1 é um PDV — não precisa de um backend em serviço
separado. Next.js App Router com Route Handlers/Server Actions cobre API +
SSR + PWA no mesmo deploy. Se um dia precisar escalar para múltiplos serviços
(ex: um worker de sincronização fiscal), extrai-se para um serviço dedicado
sem reescrever a camada de domínio (ver `src/server/domain` em
[04-padroes-codigo](./04-padroes-codigo.md) — a lógica de negócio já vive
isolada de "é rota HTTP do Next").

## Multi-tenant: como um tenant é resolvido

1. Cada tenant tem um `slug` (ex: `mercadinho-da-karol`) e opcionalmente um
   domínio próprio (`caixa.mercadinhodakarol.com.br`).
2. Middleware do Next (`src/middleware.ts`) lê o host da requisição, resolve
   o tenant (cache em memória + fallback no banco) e injeta `tenant_id` no
   contexto da requisição (header interno / `AsyncLocalStorage`).
3. Toda query ao banco passa pelo repositório (`src/server/repositories/*`),
   que **sempre** filtra por `tenant_id` — nunca é opcional, nunca é passado
   manualmente pela camada de UI/rota.
4. Autenticação (sessão do operador) é escopada ao tenant: o mesmo PIN em dois
   tenants diferentes são contas diferentes.

Ver detalhamento em [07-multitenant-whitelabel](./07-multitenant-whitelabel.md).

## Offline-first no caixa (PWA)

O ponto de venda não pode parar se a internet cair. Estratégia:

- **Catálogo de produtos**: cacheado no IndexedDB, sincronizado a cada login e
  em background (`stale-while-revalidate`). Vender não depende de rede.
- **Venda**: ao finalizar, a venda é gravada localmente (IndexedDB) com um
  UUID gerado no cliente e status `pending_sync`, e a UI já responde como
  concluída ("Venda Confirmada"). Um worker em background tenta enviar para o
  servidor; se falhar, tenta de novo com backoff. Isso evita perder venda por
  falha de rede no meio do checkout.
- **Abertura/Fechamento de caixa**: idealmente online (é um evento raro), mas
  o fluxo de abertura também cai na fila offline se necessário — o servidor é
  a fonte da verdade final quando sincroniza.
- **Conflitos**: como cada venda tem UUID gerado no cliente, o servidor faz
  upsert idempotente — reenvio duplicado nunca duplica a venda.

## Ambientes e deploy

- **Hospedagem**: Vercel (Next.js) — deploy por tenant não é necessário, é uma
  aplicação single-deploy multi-tenant (ver acima).
- **Banco**: Postgres gerenciado (Neon ou Supabase) — escolher o que tiver
  melhor free tier no momento da implementação; a única exigência é suportar
  connection pooling (PgBouncer) por causa de serverless.
- **Storage de imagens** (fotos de produto/operador, logo do tenant): um bucket
  S3-compatível (Cloudflare R2 ou Supabase Storage) — nunca base64 no banco.
- **Variáveis de ambiente**: `DATABASE_URL`, `SESSION_SECRET`, `STORAGE_*`.
  Configuração de tema/nome por tenant **não é env var** — é dado no banco
  (ver 06 e 07), porque numa mesma instalação vários tenants coexistem.

## Diretórios (visão de arquitetura, detalhe de código em 04)

```
src/
  app/                # rotas (App Router), por área: (auth)/, (pdv)/, (admin)/
  server/
    domain/           # regras de negócio puras, sem depender de Next/HTTP
    repositories/     # acesso a dado (Prisma), sempre tenant-scoped
    actions/          # Server Actions — thin wrapper sobre domain
  components/         # componentes de UI reutilizáveis (ver 05)
  lib/                # utilidades genéricas (formatação, datas, etc.)
  styles/             # tokens de tema, ver 06
prisma/
  schema.prisma
docs/
  specs/              # este diretório
