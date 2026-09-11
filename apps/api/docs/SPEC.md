# apps/api — Spec do Backend

Este documento é específico da implementação do backend. Contexto de
produto, arquitetura geral e regras de negócio estão em `../../docs/specs/`
(raiz do monorepo) — leia primeiro `01-arquitetura.md`, `03-regras-negocio.md`
e `07-multitenant-whitelabel.md`. Aqui: o que existe dentro de `apps/api`
especificamente — módulos, endpoints, convenções de DTO/erro/teste.

## Responsabilidade deste app

NestJS — toda regra de negócio e todo acesso a dado (Prisma/PostgreSQL).
`apps/web` nunca fala com o banco; fala só com este serviço, por HTTP.

## Módulos e endpoints

Convenção de rota: `/{modulo}` (nunca inclui o tenant na URL — o tenant é
resolvido pelo host, ver `TenantMiddleware` abaixo, não por path param).

### `auth`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| GET | `/auth/operadores` | Lista operadores ativos do tenant (avatar+nome, para a tela de seleção do Login) | público (dentro do tenant) |
| POST | `/auth/login` | `{ operadorId, pin }` → seta cookie de sessão | público |
| POST | `/auth/logout` | Encerra sessão | operador |
| GET | `/auth/me` | Operador logado + papel + tenant | operador |

### `tenant`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| GET | `/tenant/atual` | Dados do tenant resolvido (nome, logo, cores) — consumido pelo `apps/web` para montar o tema, ver `06-design-system-temas.md` | público (dentro do tenant) |

### `operador`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| GET | `/operadores` | Lista (inclui inativos, para a tela de gestão) | admin |
| POST | `/operadores` | Cria (nome, papel, PIN inicial, foto opcional) | admin |
| PATCH | `/operadores/:id` | Edita dados/foto | admin |
| PATCH | `/operadores/:id/pin` | Reseta/define novo PIN | admin |
| PATCH | `/operadores/:id/ativo` | Toggle ativo/inativo | admin |
| DELETE | `/operadores/:id` | Soft-delete | admin |

Todas as mutações acima validam a regra "sempre deve existir ao menos 1
admin ativo" no `OperadorService` (ver `03-regras-negocio.md`) — a validação
vive no service, não no controller nem na UI.

### `produto`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| GET | `/produtos` | Lista (com filtro de busca/categoria via query params) | operador |
| GET | `/produtos/:id` | Detalhe | operador |
| POST | `/produtos` | Cria | admin |
| PATCH | `/produtos/:id` | Edita | admin |
| DELETE | `/produtos/:id` | Soft-delete | admin |

### `caixa`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| GET | `/caixa/atual` | Sessão aberta (se houver) do tenant | operador |
| POST | `/caixa/abrir` | Abre sessão (`{ valorInicial }`) — 409 se já existe uma aberta | operador |
| POST | `/caixa/:id/fechar` | Fecha, calcula totais por forma de pagamento | operador |
| GET | `/caixa/:id/vendas` | Histórico de vendas da sessão (usado na tela de Fechamento) | operador |

### `venda`

| Método | Rota | Descrição | Papel exigido |
|---|---|---|---|
| POST | `/vendas` | Cria uma venda (`{ uuid, itens[], formaPagamento }`) — idempotente pelo `uuid` gerado no cliente (ver estratégia offline em `01-arquitetura.md`) | operador |
| POST | `/vendas/sincronizar` | Recebe um lote de vendas pendentes da fila offline, upsert idempotente por `uuid` | operador |
| GET | `/dashboard/resumo` | Totais do dia, mais vendidos, gráfico da semana | operador |

## Convenções de DTO

- Todo `Controller` recebe um DTO decorado com `class-validator`
  (`CriarProdutoDto`, `AtualizarOperadorDto`, etc.) — nunca um `any`/`object`
  cru.
- Onde o schema já existe em `packages/shared` (Zod, compartilhado com o
  formulário do frontend), o DTO do Nest deriva dele — não redefinir a
  mesma regra de validação em paralelo (ver `04-padroes-codigo.md`).
- Resposta de erro de negócio segue um formato único, capturado por um
  `ExceptionFilter` global:

```json
{ "statusCode": 409, "code": "CAIXA_JA_ABERTO", "message": "Já existe uma sessão de caixa aberta." }
```

`code` é estável e machine-readable (o frontend pode decidir UI a partir
dele); `message` é o texto em português mostrado ao usuário.

## Tenant e autenticação (implementação)

- `TenantMiddleware` (global, registrado em `AppModule`): lê o header
  interno enviado pelo `apps/web` (`x-tenant-host` ou equivalente),
  resolve o `Tenant` (cache em memória, TTL curto + invalidação ao
  atualizar tema) e anexa via `AsyncLocalStorage` — disponível em qualquer
  ponto da request via `CurrentTenant()` (decorator).
- `AuthGuard` (aplicado a todo módulo exceto rotas públicas listadas acima):
  lê o cookie de sessão, valida contra a tabela de sessão/JWT, e confirma que
  o `tenantId` da sessão bate com o tenant resolvido pelo middleware — uma
  sessão de um tenant nunca é aceita em outro.
- `RolesGuard` + decorator `@Roles('admin')`: aplicado nos endpoints que
  exigem papel Administrador (ver tabela de módulos acima).

## Prisma / banco

- `schema.prisma` em `apps/api/prisma/schema.prisma`.
- Toda entidade de domínio tem `tenantId String` com
  `@@index([tenantId, ...])` nas queries mais comuns.
- Migrations versionadas (`prisma migrate dev` em desenvolvimento,
  `prisma migrate deploy` no deploy via Docker Compose).
- RLS do Postgres como segunda camada de defesa (ver `01-arquitetura.md`) —
  configurada via migration SQL própria (`prisma migrate dev --create-only`
  + SQL manual de `CREATE POLICY`), não é algo que o Prisma gera sozinho.

## Testes (ver `04-padroes-codigo.md` para a régua geral)

- `*.service.spec.ts`: um arquivo por `Service`, cobrindo cada regra de
  `03-regras-negocio.md` relevante ao módulo (ex.: `caixa.service.spec.ts`
  testa "não pode abrir caixa com uma já aberta", "não pode vender com caixa
  fechado", "fechamento é imutável").
- `*.controller.spec.ts`: valida DTO rejeita payload inválido, roteamento e
  guards (papel errado → 403).
- Sem teste de integração contra Postgres real no CI por padrão — usar
  `Repository` mockado nos testes de `Service`; se precisar de teste de
  integração com banco real, isolar num job de CI separado (mais lento),
  não no caminho crítico de todo PR.
