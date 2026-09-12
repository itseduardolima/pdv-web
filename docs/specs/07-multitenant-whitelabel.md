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

1. Criar registro `Tenant` (nome, slug, cor primária, logo) — via um painel
   interno simples (não precisa ser bonito, é uso interno de quem revende) ou
   via script/seed no início, antes de existir um painel de onboarding.
2. Criar o primeiro `Operador` com papel `admin` para esse tenant (não existe
   tenant sem pelo menos um admin — mesma regra do
   [03-regras-negocio](./03-regras-negocio.md)).
3. Pronto — nenhum passo de build/deploy por cliente. O tema já é aplicado em
   runtime (ver [06](./06-design-system-temas.md)).

### Como fazer hoje: seed parametrizado (`apps/api/prisma/seed.ts`)

O seed é idempotente e lê variáveis de ambiente. Rodar de novo com o mesmo
slug atualiza nome/cores e **nunca** duplica nem troca o PIN de um
Administrador já existente. Na VPS ele já vem compilado na imagem da API
(`dist/seed/seed.js`):

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
  api node dist/seed/seed.js
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

- Painel de self-service para o próprio revendedor criar tenants sem tocar
  código/banco é desejável a médio prazo, mas não bloqueia o lançamento do
  primeiro cliente — o fluxo manual acima (passos 1–2) é aceitável em v1.
