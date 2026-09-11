# Padrões de Código

## Estrutura de pastas — `apps/api` (NestJS)

```
apps/api/src/
  modules/
    tenant/
      tenant.module.ts
      tenant.controller.ts
      tenant.service.ts
      tenant.repository.ts
      dto/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts          # login por PIN, emissão de sessão
      strategies/
      guards/                  # AuthGuard, RolesGuard (admin/operador)
    operador/
      operador.module.ts
      operador.controller.ts
      operador.service.ts
      operador.repository.ts
      dto/
    produto/
      (mesma forma)
    caixa/
      (mesma forma) — CaixaSession, abertura/fechamento
    venda/
      (mesma forma) — inclui endpoint de sincronização offline
  common/
    middlewares/
      tenant.middleware.ts
    guards/
    decorators/
      current-tenant.decorator.ts
      current-operador.decorator.ts
    filters/                    # exception filters (erro de negócio → HTTP)
    interceptors/
  prisma/
    prisma.module.ts
    prisma.service.ts
  main.ts
prisma/
  schema.prisma
  migrations/
```

Regra por módulo: **Controller nunca fala com o Prisma diretamente.**
`Controller` recebe o DTO validado → chama `Service` (regra de negócio) →
`Service` chama `Repository` (acesso a dado, sempre tenant-scoped). Isso
existe para que uma regra de negócio (ex: "não pode vender com caixa
fechado") seja testável isolando o `Service` com um `Repository` mockado.

## Estrutura de pastas — `apps/web` (Next.js)

```
apps/web/src/
  app/
    (public)/login/                # rota de login, sem sidebar
    (pdv)/
      vender/
      produtos/
      produtos/[id]/editar/
      fechamento/
      dashboard/
      operadores/
      operadores/[id]/editar/
      layout.tsx                   # shell com sidebar/bottom-nav (ver 05)
  components/
    ui/                             # primitivos: Button, Input, PillButton, Toggle...
    pdv/                             # composto de domínio: ProductCard, CartLine, PinKeypad...
    layout/                          # Sidebar, BottomNav, AppShell
  lib/
    api-client.ts                    # client HTTP tipado, consome apps/api
  styles/
    theme.css                        # tokens default (ver 06)
```

`apps/web` não acessa banco nem Prisma — toda leitura/escrita passa pelo
`api-client` contra `apps/api`. Os tipos de request/response desse client
vêm de `packages/shared` (schemas Zod compartilhados).

## Nomenclatura

- Módulos, Controllers, Services, Repositories do Nest: singular, sufixo
  explícito (`ProdutoService`, `ProdutoController`, `ProdutoRepository`) —
  é a convenção do próprio Nest CLI (`nest g resource produto`), manter.
- Arquivos de componente React: `PascalCase.tsx` (`ProductCard.tsx`).
- Arquivos de lógica/util: `kebab-case.ts` (`format-currency.ts`).
- DTOs do Nest: `CriarProdutoDto`, `AtualizarProdutoDto` — nome da ação em
  português, sufixo `Dto` em inglês (convenção Nest).
- Tipos e interfaces de domínio (fora de DTO): `PascalCase`, sem prefixo `I`
  (`Produto`, não `IProduto`).
- Nomes de domínio **em português** (é o vocabulário do negócio: `Venda`,
  `Operador`, `Caixa`, `Produto`) — evita a tradução mental entre o que o
  cliente fala e o que o código diz. Nomes técnicos genéricos (guards, utils
  de infraestrutura, decorators) em inglês, como é convenção do Nest e do
  ecossistema (`AuthGuard`, `useQuery`, `formatCurrency`).
- Componentes de UI genéricos (`Button`, `Toggle`, `Modal`) em inglês, porque
  não são vocabulário de negócio, são vocabulário de design system.

## TypeScript

- `strict: true` sempre, nos dois apps.
- Não usar `any` — se o tipo é genuinamente desconhecido, usar `unknown` e
  fazer narrowing.
- DTOs do Nest são a fronteira de validação de entrada (via
  `class-validator`); tipos de domínio internos ao `Service`/`Repository`
  não precisam repetir validação já feita no DTO.
- Erros de regra de negócio (ex: "caixa já fechado", "estoque insuficiente")
  são exceções Nest tipadas (`BadRequestException` ou uma exceção de domínio
  customizada capturada por um `ExceptionFilter`), nunca um erro genérico
  sem contexto.

## Formulários (frontend)

- React Hook Form + Zod para todo formulário (Produto, Operador, Abertura de
  Caixa) — o **mesmo schema Zod de `packages/shared`** valida no cliente e é
  o que o DTO do Nest espera receber (contrato único, não duas definições
  divergentes).

## Commits

- Convenção: `tipo(escopo): descrição curta em português` — `feat(api):
  adiciona endpoint de CRUD de produtos`, `fix(web): corrige cálculo de
  troco`, `refactor(api): extrai ProdutoRepository`.
- Escopo é o app ou módulo afetado (`api`, `web`, `api/venda`, etc.) — opcional
  quando afeta o repo como um todo (`docs:`, `chore:`).
- Tipos: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`.

## Testes

- `apps/api/src/modules/**/*.service.spec.ts`: testa o `Service` com o
  `Repository` mockado — é onde a regra de negócio (spec 03) é verificada.
- `apps/api/src/modules/**/*.controller.spec.ts`: teste de integração leve
  via `Test.createTestingModule`, cobre validação de DTO + roteamento.
- Fluxos críticos end-to-end com Playwright em `apps/web`, contra uma API
  real de ambiente de teste: login → abrir caixa → vender → fechar caixa.
  Roda no CI antes de qualquer merge na branch principal.
- Não escrever teste para estilo/CSS — isso é validado visualmente, não por
  assert.

## O que NÃO fazer

- Não introduzir abstração para "caso genérico" antes de existir um segundo
  caso real (ex: não construir um "motor de regras" configurável para
  permissões — são só dois papéis, ver
  [03-regras-negocio](./03-regras-negocio.md)).
- Não hardcodar cor, nome do mercado, ou texto de marca em componente — tudo
  isso vem do tema do tenant (ver [06](./06-design-system-temas.md)).
- Não deixar `tenantId` como parâmetro opcional em `Repository` — é sempre
  obrigatório e vem do contexto de request (`CurrentTenant` decorator),
  nunca escolhido pela camada de Controller/UI.
- Não duplicar validação: se já existe um schema Zod em `packages/shared`
  para uma entidade, o DTO do Nest e o formulário do Next devem os dois
  derivar dele, não redefinir regras de validação em paralelo.
