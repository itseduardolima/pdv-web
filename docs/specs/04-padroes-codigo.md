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
        page.tsx
        use-sell-page.ts           # hook DE PÁGINA, colocado — só orquestração/lógica
      products/
      products/[id]/edit/
        page.tsx
        use-product-form.ts        # idem — colocado junto do page.tsx que ele serve
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
  hooks/
    queries/
      use-products.ts               # React Query (useQuery) — GET /products
      use-create-sale.ts            # React Query (useMutation) — POST /sales
      use-cash-session.ts           # React Query — GET/POST /cash-sessions
      ...
    use-cart.ts                     # hook compartilhado (não-query), usado por mais de uma página
    use-pin-input.ts
  lib/
    api-client.ts                   # client HTTP tipado, consome apps/api
    tenant-theme.ts                 # gera o <style> com os tokens do tenant
    utils/
      format-currency.ts            # função pura, reutilizável — nunca inline num componente
      format-date.ts
      ...
  styles/
    theme.css                       # tokens default (ver 06)
    globals.css
```

`apps/web` não acessa banco nem Prisma — toda leitura/escrita passa pelo
`api-client` contra `apps/api`. Os tipos de request/response desse client
vêm de `packages/shared` (schemas Zod compartilhados).

## Separação de lógica e UI (frontend) — regra dura

**Todo `page.tsx` é só view.** Nenhum `useState`, `useQuery`, `useMutation`,
handler de evento ou cálculo é escrito direto dentro de um `page.tsx` — mas
nem toda lógica vai pro mesmo lugar. Três categorias de hook, cada uma com
pasta e propósito diferentes:

### 1. Hook de página — colocado, só orquestração

Vive **na mesma pasta do `page.tsx` que ele serve** (não em `hooks/`),
nomeado `use-<página>.ts` (`use-sell-page.ts`, `use-product-form.ts`). Só
existe pra aquela página — nunca importado por outra. Sua responsabilidade
é **exclusivamente lógica de orquestração**: estado local de UI (ex.: qual
step do formulário), handlers de evento, decidir o que compor — ele **não
busca dado sozinho**, ele chama os hooks de query (categoria 2) e monta o
resultado pra página consumir.

```tsx
// app/(pos)/sell/use-sell-page.ts
import { useCart } from '@/hooks/use-cart'
import { useProducts } from '@/hooks/queries/use-products'
import { useCreateSale } from '@/hooks/queries/use-create-sale'

export function useSellPage() {
  const cart = useCart()
  const { data: products, isLoading } = useProducts()
  const createSale = useCreateSale()

  function handleAddItem(productId: string) {
    cart.addItem(productId)
  }

  function handleFinalize() {
    createSale.mutate({ items: cart.items, paymentMethod: cart.paymentMethod })
  }

  return { products, isLoading, cart, handleAddItem, handleFinalize, createSale }
}

// app/(pos)/sell/page.tsx
export default function SellPage() {
  const { products, cart, handleAddItem, handleFinalize } = useSellPage()
  return (/* só JSX, nenhuma lógica aqui */)
}
```

### 2. Hooks de dado — sempre TanStack Query, em `hooks/queries/`

Toda busca ou mutação de dado contra a API é um hook próprio construído
sobre **TanStack Query** (`useQuery`/`useMutation`), um arquivo por
recurso/ação (`use-products.ts`, `use-create-sale.ts`,
`use-cash-session.ts`), em `hooks/queries/` — nunca dentro do hook de
página, nunca `fetch`/`apiRequest` chamado direto de um componente ou de um
hook de página. Motivo: um hook de query em `hooks/queries/` é reusável por
qualquer página que precise do mesmo dado (ex.: `useProducts` serve a tela
de Vender e a de Produtos), tem cache/invalidação centralizados, e pode ser
testado isolado do fluxo de uma página específica.

```tsx
// hooks/queries/use-products.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiRequest('/products', { schema: z.array(productSchema) }),
  })
}
```

### 3. Hooks compartilhados (não-query) — `hooks/`

Lógica reutilizável entre páginas que não é busca de dado — `useCart`,
`usePinInput`, `useDebounce`. Vivem em `hooks/` (fora de `queries/`), sem
prefixo de página porque não pertencem a uma só.

- Isso vale para toda tela do produto (Vender, Produtos, Operadores,
  Fechamento, Dashboard) — não é um padrão só pra tela complexa.
- `page.tsx` fica testável por leitura (é óbvio o que renderiza); o hook de
  página fica testável isolado sem precisar mockar chamada de rede (ele só
  orquestra, quem busca dado são os hooks de `queries/`, que por sua vez
  são testáveis isolados de qualquer página) — ver `05-componentizacao.md`.

**Nenhuma função solta dentro de um arquivo de componente.** Uma função que
não depende de estado/props do componente (formatação, cálculo, parsing) é
uma função pura e vai para `lib/utils/`, agrupada por assunto
(`format-currency.ts`, `format-date.ts`, `slugify.ts`...), nunca declarada
inline no topo ou dentro de um `.tsx`. Isso vale mesmo que a função só seja
usada uma vez hoje — o ponto é reuso e teste isolado, não "está sendo
reusada agora".

- Se a função depende de estado/hook do React (ex.: `useDebounce`), ela não
  é um util — é um hook, vai para `hooks/`.
- Se a função é regra de negócio (cálculo de troco, validação), ela não
  deveria estar no frontend de forma alguma — ver seção Formulários acima:
  validação e regra são sempre do backend.

## Idioma

- **Código inteiro em inglês**: identificadores, nomes de arquivo, nomes de
  domínio, rotas HTTP, códigos de erro, nomes de tabela/coluna no Prisma.
  Vocabulário de domínio traduzido de forma fixa (usar sempre estes termos,
  nunca sinônimos):

  | Negócio (PT)                   | Código (EN)                                 |
  | ------------------------------ | ------------------------------------------- |
  | Operador                       | `Operator`                                  |
  | Administrador / papel          | `OperatorRole` = `ADMIN` \| `OPERATOR`      |
  | Produto                        | `Product`                                   |
  | Caixa (sessão)                 | `CashSession`                               |
  | Abertura / fechamento de caixa | `openCashSession` / `closeCashSession`      |
  | Venda                          | `Sale`                                      |
  | Item de venda                  | `SaleItem`                                  |
  | Forma de pagamento             | `PaymentMethod` = `CASH` \| `CARD` \| `PIX` |
  | Estoque                        | `stock`                                     |
  | Código de barras               | `barcode`                                   |
  | Loja (tenant)                  | `Tenant`                                    |

- **Texto exibido ao usuário em português** (mensagens de erro da API,
  rótulos, títulos de tela) — é copy, não código.
- **Comentários: poucos, e em português.** Só quando o _porquê_ não é óbvio
  (uma invariante, um workaround, uma restrição escondida). Nunca comentar
  o _quê_ — o nome do identificador já diz isso.
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

## Formulários (frontend) — validação é sempre do backend

**Regra dura: toda regra de validação e toda mensagem de erro vêm da API.
O frontend nunca decide se um dado é válido — ele só exibe o que a API
respondeu.** Isso vale para validação de formato de campo e para regra de
negócio; não existe uma segunda implementação da regra no cliente, nem
"provisória", nem "só pra UX".

- Os schemas Zod de `packages/shared` existem **só para tipar** o
  request/response (`z.infer`) — nunca são chamados com `.parse()` /
  `.safeParse()` no frontend para bloquear ou liberar um submit. Rodar o
  mesmo schema no cliente ainda seria o cliente decidindo; a decisão tem que
  vir de uma resposta HTTP real da API.
- React Hook Form é usado **sem resolver de validação** (sem `zodResolver`)
  — ele só governa estado de campo/submit. Todo submit chama a API; a API é
  a única que valida.
- Em caso de 400 (`code: "VALIDATION"`, ver `common/filters/domain-exception.filter.ts`),
  a resposta traz `details` (flatten do erro Zod do `nestjs-zod`) —
  o formulário mapeia `details.fieldErrors["<campo>"]` para a mensagem
  exibida embaixo de cada input. Nenhuma mensagem de validação é escrita no
  frontend.
- Erro de regra de negócio (`CASH_SESSION_ALREADY_OPEN`, `INSUFFICIENT_STOCK`,
  `LAST_ADMIN`, etc.) chega com `message` já em português, pronta pra
  mostrar — o frontend não interpreta o `code` para gerar seu próprio texto,
  só decide _onde_ mostrar a mensagem (`InlineAlert`, ver
  `apps/web/docs/DESIGN_SYSTEM.md` § Validação e feedback).
- Feedback "em tempo real" (antes do submit) não existe como validação
  paralela do cliente — se um dia for necessário, é uma chamada real à API
  (debounced), nunca uma cópia local da regra.

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
