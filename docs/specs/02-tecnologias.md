# Tecnologias

Escolhas feitas priorizando: fronteira clara entre frontend e backend, custo
baixo de hospedagem, um único código de UI para desktop/tablet/celular, e a
possibilidade de operar offline no caixa.

## Monorepo

| Camada | Escolha | Por quê |
|---|---|---|
| Gerenciador de workspace | pnpm workspaces | Instala rápido, dedupe de deps entre `apps/web` e `apps/api` |
| Orquestração de build/test | Turborepo | Cache e paralelismo entre os apps do monorepo |

## Backend (`apps/api`)

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **NestJS** | Módulos/Controllers/Services/DTOs impõem a separação de domínio vs. HTTP por convenção da framework — ver justificativa em [01-arquitetura](./01-arquitetura.md) |
| Linguagem | TypeScript (strict) | Tipagem de domínio (produto, venda, operador) evita boa parte dos bugs de PDV (troco, estoque) |
| ORM / banco | Prisma + PostgreSQL | Migrations versionadas, tipos gerados a partir do schema, `PrismaService` injetável no Nest |
| Validação | `nestjs-zod` (`ZodValidationPipe` global + `createZodDto`) sobre os schemas Zod de `packages/shared` | O mesmo schema valida no formulário do frontend e na borda do Controller — uma única fonte da verdade do contrato, sem redefinir regras em `class-validator` |
| Auth | `@nestjs/jwt` — sessão do operador em JWT dentro de cookie httpOnly, PIN hasheado com argon2; `AuthGuard` global com `@Public()` para as rotas abertas | PIN de 4-6 dígitos não é senha forte — mitiga com hashing, rate-limit de tentativas (`@nestjs/throttler`) e sessão de operador por tenant |
| Multi-tenant | Middleware Nest (`TenantMiddleware`) + Guard de autenticação escopado ao tenant resolvido | Ver [07-multitenant-whitelabel](./07-multitenant-whitelabel.md) |
| Upload de imagem | **MinIO** (S3-compatible, self-hosted, container na VPS) via URL assinada, gerada por um endpoint da API | Fotos de produto/operador e logo do tenant nunca em base64 no banco; MinIO fala a mesma API S3 então o código não muda se um dia migrar para um provedor gerenciado — ver [01-arquitetura](./01-arquitetura.md) |
| Testes unitários | **Jest** (padrão que o Nest CLI já scaffolda — manter) para `Service`s; Nest também facilita teste de integração de `Controller` com `Test.createTestingModule` | Regra de negócio (spec 03) testada isolada de HTTP, com `Repository` mockado; integração cobre o fio Controller→Service→Repository |
| Docs de API | `@nestjs/swagger` | Gera OpenAPI a partir dos DTOs já existentes — documentação sempre sincronizada com o contrato real |

## Frontend (`apps/web`)

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 14+ (App Router), **só como frontend** (SSR das telas + PWA) | Não hospeda regra de negócio — toda chamada de dado vai para `apps/api`; ver [01-arquitetura](./01-arquitetura.md) |
| Estilo | Tailwind CSS + CSS variables para tema | Tailwind pelo ritmo de desenvolvimento; CSS vars porque o tema (cor/nome) precisa trocar em runtime por tenant, não em build — ver [06](./06-design-system-temas.md) |
| Componentes base | Radix UI primitives (headless) | Acessibilidade (foco, teclado, aria) de graça; estilizamos por cima com nosso design system |
| Estado servidor | TanStack Query | Cache, refetch, e principalmente: estratégia de retry/offline que combina bem com Service Worker, consumindo a API NestJS |
| Estado local (UI) | Zustand | Carrinho em progresso, teclado de PIN, estado de formulário — sem boilerplate de Context |
| Offline storage | Dexie (wrapper de IndexedDB) | Fila de vendas pendentes de sincronizar com a API, cache de catálogo |
| PWA | `next-pwa` (ou Serwist) | Service worker, instalável, ícone do tenant |
| Formulários | React Hook Form (sem resolver de validação) + schemas Zod de `packages/shared` só para tipagem | Validação é sempre da API — o frontend nunca decide se um dado é válido, só exibe a resposta; ver `04-padroes-codigo.md` § Formulários |
| Testes (unitário de componente + E2E) | **Cypress** (Component Testing para `components/ui` e `components/pos`; E2E para os fluxos completos) | Um único runner cobre os dois níveis do frontend — testa `PinKeypad`, `ProductCard`, `PhotoUploadBox` isolados (unitário/componente) e depois os fluxos críticos de ponta a ponta: abrir caixa → vender → fechar caixa, contra a API real (ambiente de teste) |

## Compartilhado (`packages/shared`)

| Camada | Escolha | Por quê |
|---|---|---|
| Contrato de API | Schemas Zod compartilhados entre `apps/web` e `apps/api` | Fonte única da verdade do formato de request/response — evita o contrato divergir entre front e back com o tempo |

## Qualidade e CI

| Camada | Escolha | Por quê |
|---|---|---|
| Lint/Format | ESLint + Prettier (config única em `packages/config`, sem exceção por app) | Consistência entre `web` e `api` |
| CI | GitHub Actions (lint + typecheck + testes em cada PR, usando cache do Turborepo; deploy via SSH na branch principal) | Barato e já integrado ao repo |
| Hospedagem | **VPS própria (Hostinger)**, tudo via Docker Compose: `apps/web`, `apps/api`, PostgreSQL e MinIO no mesmo servidor, Nginx/Caddy como reverse proxy + TLS | Decisão explícita: sem PaaS/serviço gerenciado terceirizado (nada de Vercel/Supabase/Railway) — custo fixo e previsível de uma VPS só. Ver [01-arquitetura](./01-arquitetura.md) |
| Banco | PostgreSQL em container na própria VPS (volume persistente + backup `pg_dump` agendado para destino externo) | Mesmo motivo acima — nada de Postgres gerenciado de terceiro |

## Coisas que optamos por NÃO usar (e por quê)

- **App nativo (React Native/Flutter)**: descartado — o objetivo é um único
  código cobrindo os 3 tamanhos sem loja de app; PWA resolve instalação e
  offline sem esse custo.
- **Next.js full-stack (API Routes/Server Actions como backend)**:
  descartado — decisão explícita de ter NestJS como backend dedicado, ver
  [01-arquitetura](./01-arquitetura.md).
- **Redux**: Zustand cobre o caso de uso com muito menos boilerplate; não há
  necessidade de time-travel debugging ou middleware complexo aqui.
- **GraphQL**: REST simples é suficiente para o volume de endpoints de um
  PDV; Nest com Swagger já dá contrato documentado sem a complexidade
  adicional de um schema GraphQL e resolvers.
- **PaaS/serviço gerenciado de terceiro para hospedagem (Vercel, Supabase,
  Railway, Fly.io etc.)**: descartado — decisão explícita do projeto de
  hospedar tudo numa VPS própria (Hostinger) via Docker Compose, custo fixo
  em vez de cobrança por uso. Ver [01-arquitetura](./01-arquitetura.md).
