# apps/api — Spec do Backend

Este documento é específico da implementação do backend. Contexto de
produto, arquitetura geral e regras de negócio estão em `../../docs/specs/`
(raiz do monorepo) — leia primeiro `01-arquitetura.md`, `03-regras-negocio.md`,
`04-padroes-codigo.md` (seção Idioma) e `07-multitenant-whitelabel.md`.
Aqui: o que existe dentro de `apps/api` — infra, módulos planejados,
endpoints, convenções de DTO/erro/teste.

## Responsabilidade deste app

NestJS — toda regra de negócio e todo acesso a dado (Prisma/PostgreSQL).
`apps/web` nunca fala com o banco; fala só com este serviço, por HTTP.

## Estado atual

Só a fundação está implementada (sem módulos de domínio ainda — eles entram
um por vez, cada um testado antes do próximo):

- `AppModule` com `ConfigModule`, `ThrottlerModule`, `JwtModule` (global) e
  `PrismaModule`; pipe global `ZodValidationPipe`, filtro global
  `DomainExceptionFilter`, guards globais `ThrottlerGuard` → `AuthGuard` →
  `RolesGuard`.
- `common/`: `tenant-context.ts` (`AsyncLocalStorage` + abstração
  `TenantResolver`), `TenantMiddleware`, `AuthGuard`, `RolesGuard`,
  decorators (`@Public()`, `@Roles()`, `@CurrentTenant()`,
  `@CurrentOperator()`), `DomainError` e subclasses, filtro de exceção.
- `prisma/schema.prisma` completo (Tenant, Operator, Product, CashSession,
  Sale, SaleItem) e `prisma/seed.ts` (tenant `demo`, admin com PIN 1234,
  4 produtos).

O `TenantMiddleware` só é registrado quando o módulo `tenant` existir e
fornecer o `TenantResolver`; até lá, nenhuma rota resolve tenant.

## Ordem sugerida de criação dos módulos

1. `tenant` — fornece `TenantResolver`, registra o middleware, expõe
   `GET /tenant/current`.
2. `auth` — login por PIN, cookie de sessão, `GET /auth/me`.
3. `operator` — CRUD + regra do último admin.
4. `product` — CRUD.
5. `cash-session` — abrir/fechar caixa.
6. `sale` — venda, sincronização offline, resumo do dashboard.

## Endpoints planejados

Convenção de rota: `/{resource}` em inglês, plural para coleções. O tenant
nunca vai na URL — é resolvido pelo host (`TenantMiddleware`).

### `auth`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| GET | `/auth/operators` | Operadores ativos (avatar+nome) para a tela de Login | público |
| POST | `/auth/login` | `{ operatorId, pin }` → seta cookie `pdv_session` | público |
| POST | `/auth/logout` | Encerra sessão | operador |
| GET | `/auth/me` | Operador logado + papel + tenant | operador |

### `tenant`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| GET | `/tenant/current` | Nome, logo e cores do tenant resolvido (usado pelo `apps/web` para montar o tema) | público |

### `operator`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| GET | `/operators` | Lista (inclui inativos) | admin |
| POST | `/operators` | Cria (`CreateOperatorInput`) | admin |
| PATCH | `/operators/:id` | Edita dados/foto | admin |
| PATCH | `/operators/:id/pin` | Define novo PIN | admin |
| PATCH | `/operators/:id/active` | Ativa/inativa | admin |
| DELETE | `/operators/:id` | Soft-delete | admin |

Todas as mutações validam no `OperatorService` a regra "sempre deve existir
ao menos 1 admin ativo" (`LAST_ADMIN`), ver `03-regras-negocio.md`.

### `product`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| GET | `/products` | Lista (query: `search`, `category`) | operador |
| GET | `/products/:id` | Detalhe | operador |
| POST | `/products` | Cria | admin |
| PATCH | `/products/:id` | Edita | admin |
| DELETE | `/products/:id` | Soft-delete | admin |

### `cash-session`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| GET | `/cash-sessions/current` | Sessão aberta, se houver | operador |
| POST | `/cash-sessions` | Abre (`OpenCashSessionInput`) — 409 `CASH_SESSION_ALREADY_OPEN` se já existe uma aberta | operador |
| POST | `/cash-sessions/:id/close` | Fecha e calcula totais por forma de pagamento | operador |
| GET | `/cash-sessions/:id/sales` | Vendas da sessão (tela de Fechamento) | operador |

### `sale`

| Método | Rota | Descrição | Papel |
|---|---|---|---|
| POST | `/sales` | Cria venda (`CreateSaleInput`) — idempotente por `uuid` | operador |
| POST | `/sales/sync` | Lote de vendas da fila offline, upsert por `uuid` | operador |
| GET | `/dashboard/summary` | Totais do dia, mais vendidos, semana | operador |

## Convenções de DTO e erro

- DTOs derivam dos schemas Zod de `packages/shared` com `createZodDto`
  (`nestjs-zod`); a validação acontece no `ZodValidationPipe` global.
- Erros de negócio são subclasses de `DomainError` (`NotFoundError`,
  `ConflictError`, `ForbiddenError`, `UnauthorizedError`) com `code` em
  inglês e `message` em português. Formato de resposta (todo erro):

```json
{ "statusCode": 409, "code": "CASH_SESSION_ALREADY_OPEN", "message": "Já existe um caixa aberto." }
```

Erros de validação vêm com `code: "VALIDATION"` e `details` (flatten do Zod).

## Tenant e autenticação

- `TenantMiddleware`: lê `x-tenant-host` (enviado pelo `apps/web`) ou o
  `Host`, chama `TenantResolver.resolveByHost` e guarda `tenantId` em
  `AsyncLocalStorage` (`getTenantId()` / `@CurrentTenant()`).
- `AuthGuard` (global, exceto `@Public()`): lê o JWT do cookie `pdv_session`,
  valida e confere que o `tenantId` da sessão é o tenant resolvido.
- `RolesGuard` + `@Roles('ADMIN')` nos endpoints restritos a Administrador.

## Prisma

- Toda entidade de domínio tem `tenantId` com índice composto nas queries
  mais comuns; `Sale` tem `@@unique([tenantId, uuid])` para idempotência.
- `prisma migrate dev` em desenvolvimento; `prisma migrate deploy` roda no
  `CMD` do Dockerfile antes de subir a API.
- Row-Level Security do Postgres como segunda camada (ver
  `01-arquitetura.md`) — migration SQL manual, não gerada pelo Prisma.

## Testes

- `*.service.spec.ts`: um por `Service`, cobrindo cada regra de
  `03-regras-negocio.md` do módulo, com `Repository` mockado.
- `*.controller.spec.ts`: DTO rejeita payload inválido, guards (papel errado
  → 403).
- Sem Postgres real no caminho crítico do CI.
