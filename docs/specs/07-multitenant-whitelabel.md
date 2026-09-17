# Multi-tenant / White-label

Objetivo: revender o mesmo sistema para outro mercado trocando nome, logo e
cor — sem fork, sem redeploy de código, idealmente sem nem precisar de um
desenvolvedor por cliente novo.

## Modelo de dados

```prisma
model Tenant {
  id            String   @id @default(cuid())
  slug          String   @unique        // usado em subdomínio: <slug>.pdv.app
  dominio       String?  @unique        // domínio próprio opcional
  nome          String                  // "Mercadinho da Karol"
  logoUrl       String?
  corPrimaria   String   @default("#e6e51e")
  corPrimariaInk String? // calculado se nulo (ver 06)
  corAccent     String   @default("#466cf3")
  criadoEm      DateTime @default(now())

  operadores    Operador[]
  produtos      Produto[]
  caixaSessions CaixaSession[]
}
```

Toda entidade de domínio (`Operador`, `Produto`, `CaixaSession`, `Venda`)
tem `tenantId` obrigatório com índice composto (`@@index([tenantId, ...])`
nas queries mais comuns — ex: listar produtos de um tenant).

## Isolamento de dado (garantia, não sugestão)

Duas camadas de proteção, não uma só:

1. **Camada de repositório**: toda função em `server/repositories/*` recebe
   `tenantId` como primeiro argumento obrigatório (nunca opcional) e todo
   `where` do Prisma inclui `tenantId`. Não existe função de repositório que
   busque "todos os produtos" sem tenant.
2. **Row-Level Security no Postgres** (defesa em profundidade): se o time
   crescer e alguém escrever uma query fora do padrão, o banco ainda
   recusa acesso cross-tenant. Configurado via `SET app.tenant_id` na sessão
   de conexão, policy `USING (tenant_id = current_setting('app.tenant_id'))`.

## Resolução de tenant por request

- **Subdomínio** (`karol.pdv.app`) é o caminho padrão para clientes novos —
  zero configuração de DNS do lado do cliente.
- **Domínio próprio** (`caixa.mercadinhodakarol.com.br`) é suportado via
  campo `dominio` na tabela — o cliente aponta um CNAME, o middleware resolve
  pela tabela em vez de assumir subdomínio.
- Middleware (`src/middleware.ts`) resolve o tenant uma vez por request e
  cacheia em memória (TTL curto) para não bater no banco em toda requisição.

## Onboarding de um novo tenant (fluxo operacional)

1. Criar registro `Tenant` (nome, slug, cor primária) + o primeiro
   `Operador` com papel `admin` para esse tenant (não existe tenant sem
   pelo menos um admin — mesma regra do
   [03-regras-negocio](./03-regras-negocio.md)) — **via o painel Superadmin**
   (`POST /platform/tenants`, Épico 13, ver abaixo) ou via script/seed
   (bootstrap inicial do ambiente, sem depender de já ter um superadmin
   logado).
2. Pronto — nenhum passo de build/deploy por cliente. O tema já é aplicado em
   runtime (ver [06](./06-design-system-temas.md)).

### Painel Superadmin (Épico 13) — caminho principal hoje

Conta separada de qualquer tenant (`PlatformAdmin`, e-mail+senha, ver
`01-arquitetura.md` § Autenticação de plataforma), num host reservado
(`PLATFORM_HOST`, fora do `TenantMiddleware`):

- `POST /platform/auth/login` — sessão própria (`pdv_platform_session`).
- `POST /platform/tenants` — cria a loja + o admin inicial (nome, e-mail
  opcional, PIN obrigatório) numa chamada só; reaproveita a mesma lógica do
  seed (`provisionTenant`, `apps/api/src/modules/tenant/tenant-provisioning.ts`),
  não duplica a regra. Slug único, com lista de slugs reservados
  (`admin`, `api`, `www`, `platform`) que nunca podem virar loja.
- `GET /platform/tenants` — lista lojas com contagem de operadores ativos;
  nunca dado operacional (venda, produto) de nenhuma loja.
- `PATCH /platform/tenants/:id/active` — suspende/reativa uma loja sem
  apagar nenhum dado (HU 13.7, `Tenant.active`). Loja suspensa responde
  403 `TENANT_SUSPENDED` (não 404) em qualquer request pro host dela —
  diferencia "suspensa" de "não existe" pra quem é dono da loja bloqueada.

### Bootstrap por script/seed (`apps/api/prisma/seed.ts`) — ainda necessário

O script continua existindo, agora reaproveitando a mesma função
(`provisionTenant`) do painel — é o caminho para bootstrapar o **primeiro**
superadmin (`SEED_PLATFORM_ADMIN_EMAIL`/`SEED_PLATFORM_ADMIN_PASSWORD`, sem
eles o seed não mexe em `PlatformAdmin`) e para ambientes novos do zero
(dev/CI/E2E), onde ainda não existe ninguém logado no painel para criar a
primeira loja.

O seed é idempotente e lê variáveis de ambiente. Rodar de novo com o mesmo
slug atualiza nome/cores e **nunca** duplica nem troca o PIN de um
Administrador já existente. Na VPS ele já vem compilado na imagem da API
(`dist/seed/prisma/seed.js`):

```bash
# local
SEED_TENANT_SLUG=karol \
SEED_TENANT_NAME='Mercadinho da Karol' \
SEED_PRIMARY_COLOR='#1a237e' \
SEED_ADMIN_NAME='Karol' SEED_ADMIN_PIN=4321 \
pnpm --filter api db:seed

# VPS (docker compose)
docker compose exec \
  -e SEED_TENANT_SLUG=karol -e SEED_TENANT_NAME='Mercadinho da Karol' \
  -e SEED_PRIMARY_COLOR='#1a237e' -e SEED_ADMIN_NAME='Karol' -e SEED_ADMIN_PIN=4321 \
  api node dist/seed/prisma/seed.js
```

| Variável                                   | Quando                              | Default                  | Uso                                 |
| ------------------------------------------ | ----------------------------------- | ------------------------ | ----------------------------------- |
| `SEED_TENANT_SLUG`                         | sempre (sem ela cria a loja `demo`) | `demo`                   | subdomínio `<slug>.APP_BASE_DOMAIN` |
| `SEED_TENANT_NAME`                         | na criação                          | `Mercadinho Demo`        | nome exibido no app e no título     |
| `SEED_TENANT_DOMAIN`                       | opcional                            | —                        | domínio próprio (CNAME do cliente)  |
| `SEED_TENANT_LOGO_URL`                     | opcional                            | —                        | logo (URL pública no MinIO)         |
| `SEED_PRIMARY_COLOR` / `SEED_ACCENT_COLOR` | opcional                            | `#e6e51e` / `#466cf3`    | tema                                |
| `SEED_PRIMARY_INK_COLOR`                   | opcional                            | calculado por contraste  | texto sobre o primário              |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_PIN`       | só se ainda não houver admin        | `Administrador` / `1234` | primeiro Administrador              |

Depois do seed, o cliente acessa `https://<slug>.app.seudominio.com.br`
(o wildcard já está no `Caddyfile`) e loga com o PIN informado; a primeira
ação deve ser trocar esse PIN pela tela de Operadores. Só a loja `demo`
recebe operadores e produtos de exemplo.

## O que garante que "trocar de mercado" é fácil

- Nenhuma cor, nome ou logo hardcoded em componente (ver 06).
- Nenhuma regra de negócio depende de qual tenant é (ex: não existe
  `if (tenant.slug === 'karol')` em lugar nenhum do código — se um cliente
  específico precisar de uma regra diferente, isso é um feature flag por
  tenant explícito na tabela, documentado, não um `if` disperso).
- Dados 100% isolados por tenant (seção acima) — um bug de um cliente nunca
  vaza para outro.

## Fora de escopo (mas vale registrar a intenção)

- ~~Painel de self-service para o próprio revendedor criar tenants sem
  tocar código/banco~~ — feito no Épico 13 (`docs/scrum/BACKLOG.md`),
  ver § Painel Superadmin acima. ~~Suspender/reativar uma loja pelo
  painel~~ — feito (HU 13.7, `Tenant.active`). Ainda fora de escopo: log de
  auditoria das ações do superadmin (HU 13.8) — P2, sem sprint definida.
