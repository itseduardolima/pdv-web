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
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts          # login por PIN, emissão de sessão
      dto/
    operator/
      operator.module.ts
      operator.controller.ts
      operator.service.ts
      operator.service.spec.ts
      operator.repository.ts
      dto/
    product/
      (mesma forma)
    cash-session/
      (mesma forma) — abertura/fechamento de caixa
    sale/
      (mesma forma) — inclui endpoint de sincronização offline e resumo do dashboard
  common/
    middlewares/
      tenant.middleware.ts
    guards/
      auth.guard.ts
      roles.guard.ts
    decorators/
      current-tenant.decorator.ts
      current-operator.decorator.ts
      roles.decorator.ts
      public.decorator.ts
    errors/
      domain.error.ts           # DomainError + subclasses (NotFound, Conflict, Forbidden)
    filters/
      domain-exception.filter.ts
    tenant-context.ts           # AsyncLocalStorage do tenant da request
  prisma/
    prisma.module.ts
    prisma.service.ts
  main.ts
prisma/
  schema.prisma
  seed.ts
  migrations/
```

Regra por módulo: **Controller nunca fala com o Prisma diretamente.**
`Controller` recebe o DTO validado → chama `Service` (regra de negócio) →
`Service` chama `Repository` (acesso a dado, sempre tenant-scoped). Isso
existe para que uma regra de negócio (ex.: "não pode vender com caixa
fechado") seja testável isolando o `Service` com um `Repository` mockado.

## Estrutura de pastas — `apps/web` (Next.js)

```
apps/web/src/
  app/
    (public)/login/                # rota de login, sem sidebar
    (pos)/
      sell/
      products/
      products/[id]/edit/
      closing/
      open-register/
      dashboard/
      operators/
      operators/[id]/edit/
      layout.tsx                   # shell com sidebar/bottom-nav (ver 05)
  components/
    ui/                             # primitivos: Button, Input, Toggle...
    pos/                            # composto de domínio: ProductCard, CartLine, PinKeypad...
    layout/                         # Sidebar, BottomNav, AppShell
  lib/
    api-client.ts                   # client HTTP tipado, consome apps/api
    tenant-theme.ts                 # gera o <style> com os tokens do tenant
  styles/
    theme.css                       # tokens default (ver 06)
    globals.css
```

`apps/web` não acessa banco nem Prisma — toda leitura/escrita passa pelo
`api-client` contra `apps/api`. Os tipos de request/response desse client
vêm de `packages/shared` (schemas Zod compartilhados).

## Idioma

- **Código inteiro em inglês**: identificadores, nomes de arquivo, nomes de
  domínio, rotas HTTP, códigos de erro, nomes de tabela/coluna no Prisma.
  Vocabulário de domínio traduzido de forma fixa (usar sempre estes termos,
  nunca sinônimos):

  | Negócio (PT) | Código (EN) |
  |---|---|
  | Operador | `Operator` |
  | Administrador / papel | `OperatorRole` = `ADMIN` \| `OPERATOR` |
  | Produto | `Product` |
  | Caixa (sessão) | `CashSession` |
  | Abertura / fechamento de caixa | `openCashSession` / `closeCashSession` |
  | Venda | `Sale` |
  | Item de venda | `SaleItem` |
  | Forma de pagamento | `PaymentMethod` = `CASH` \| `CARD` \| `PIX` |
  | Estoque | `stock` |
  | Código de barras | `barcode` |
  | Loja (tenant) | `Tenant` |

- **Texto exibido ao usuário em português** (mensagens de erro da API,
  rótulos, títulos de tela) — é copy, não código.
- **Comentários: poucos, e em português.** Só quando o *porquê* não é óbvio
  (uma invariante, um workaround, uma restrição escondida). Nunca comentar
  o *quê* — o nome do identificador já diz isso.
- Documentação (`docs/`, `CLAUDE.md`, READMEs) em português.

## Nomenclatura

- Módulos, Controllers, Services, Repositories do Nest: singular, sufixo
  explícito (`ProductService`, `ProductController`, `ProductRepository`) —
  é a convenção do próprio Nest CLI (`nest g resource product`), manter.
- Arquivos de componente React: `PascalCase.tsx` (`ProductCard.tsx`).
- Arquivos de lógica/util: `kebab-case.ts` (`format-currency.ts`).
- DTOs do Nest: `CreateProductDto`, `UpdateProductDto` — derivados do schema
  Zod de `packages/shared` via `nestjs-zod` (`createZodDto`).
- Tipos e interfaces: `PascalCase`, sem prefixo `I` (`Product`, não
  `IProduct`).
- Valores monetários sempre em centavos inteiros, sufixo `Cents`
  (`salePriceCents`, `totalCents`) — nunca `number` decimal para dinheiro.
- Timestamps com sufixo `At` (`createdAt`, `closedAt`, `deletedAt`).

## TypeScript

- `strict: true` sempre, nos dois apps.
- Não usar `any` — se o tipo é genuinamente desconhecido, usar `unknown` e
  fazer narrowing.
- Validação de entrada acontece na borda do Controller, via
  `ZodValidationPipe` global (`nestjs-zod`) sobre DTOs derivados dos schemas
  de `packages/shared`; `Service`/`Repository` recebem dado já validado e não
  repetem a validação.
- Erros de regra de negócio (ex.: caixa já aberto, estoque insuficiente) são
  subclasses de `DomainError` com `code` estável em inglês
  (`CASH_SESSION_ALREADY_OPEN`, `INSUFFICIENT_STOCK`) e `message` em
  português, mapeadas para HTTP por um `ExceptionFilter` global — nunca um
  erro genérico sem contexto.

## Formulários (frontend)

- React Hook Form + Zod para todo formulário (Product, Operator, abertura de
  caixa) — o **mesmo schema Zod de `packages/shared`** valida no cliente e é
  o que o DTO do Nest espera receber (contrato único, não duas definições
  divergentes).

## Commits

- Conventional Commits, **em inglês**: `type(scope): short description` —
  `feat(api): add product CRUD endpoints`, `fix(web): correct change
  calculation`, `refactor(api): extract ProductRepository`.
- Escopo é o app ou módulo afetado (`api`, `web`, `shared`, `api/sale`) —
  opcional quando afeta o repo como um todo (`docs:`, `chore:`).
- Tipos: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `ci`.
- Descrição no imperativo, minúscula, sem ponto final.

## Testes

Backend (`apps/api`), unitário com Jest:

- `apps/api/src/modules/**/*.service.spec.ts`: testa o `Service` com o
  `Repository` mockado — é onde a regra de negócio (spec 03) é verificada.
  Toda regra em [03-regras-negocio](./03-regras-negocio.md) (permissão de
  admin, imutabilidade de caixa fechado, estoque não-negativo, etc.) precisa
  de um teste unitário correspondente aqui — é o nível onde essas regras são
  provadas, não só documentadas.
- `apps/api/src/modules/**/*.controller.spec.ts`: teste de integração leve
  via `Test.createTestingModule`, cobre validação de DTO + roteamento.

Frontend (`apps/web`), com **Cypress** nos dois níveis:

- **Component Testing** (`apps/web/src/components/**/*.cy.tsx`): testa
  componente isolado, sem subir a aplicação inteira — `PinKeypad` (dígitos,
  limpar, backspace), `ProductCard`, `PhotoUploadBox` (mesmo componente
  reusado por Produto e Operador, ver spec 05), `Toggle`, `PaymentMethodPicker`.
  Este é o "teste unitário" do frontend — cobre lógica/estado do componente
  sem depender de rede ou da API.
- **E2E** (`apps/web/cypress/e2e/**/*.cy.ts`): fluxos críticos de ponta a
  ponta contra uma API real de ambiente de teste — login → abrir caixa →
  vender → fechar caixa. Roda no CI antes de qualquer merge na branch
  principal.

Regra geral: não escrever teste para estilo/CSS (raio de borda, cor) — isso
é validado visualmente, não por assert. Teste comportamento (o que o
componente faz/emite), não aparência.

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
