# apps/web — Spec do Frontend

Este documento é específico da implementação do frontend. Contexto de
produto, arquitetura geral e regras de negócio estão em `../../docs/specs/`
(raiz do monorepo) — leia primeiro `01-arquitetura.md`, `03-regras-negocio.md`
e `05-componentizacao.md`. Aqui: o que existe dentro de `apps/web`
especificamente. Design system e tokens estão em [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## Responsabilidade deste app

Next.js (App Router) — **só apresentação**. Renderiza as telas, roda como
PWA, guarda fila offline. Nunca acessa Prisma/banco. Toda leitura/escrita
passa pelo client HTTP tipado (`src/lib/api-client.ts`) contra `apps/api`.

## Rotas (App Router)

```
src/app/
  (public)/
    login/page.tsx                      # seleção de operador + teclado de PIN
  (pos)/
    layout.tsx                          # AppShell: sidebar (desktop/tablet) / bottom-nav (celular)
    sell/page.tsx                       # Vender
    sell/confirmed/page.tsx             # Venda Confirmada
    products/page.tsx
    products/new/page.tsx
    products/[id]/edit/page.tsx
    closing/page.tsx                    # Fechamento (inclui Histórico de Vendas da sessão)
    open-register/page.tsx              # Abertura de Caixa — redireciona para cá se não há caixa aberto
    dashboard/page.tsx
    operators/page.tsx
    operators/new/page.tsx
    operators/[id]/edit/page.tsx
  (public)/
    forgot-pin/page.tsx                 # "Esqueci meu PIN": pede e-mail, resposta sempre genérica
    set-pin/page.tsx                    # ?token= — primeiro acesso ou redefinição, teclado de PIN
```

Rotas (URLs) em inglês, como o resto do código (ver `04-padroes-codigo.md`,
seção Idioma); o título visível de cada tela continua em português.

Regra de navegação: se o operador logado não tem uma `CashSession` aberta e
tenta acessar `sell`, `products`, `closing`, `dashboard` ou `operators`,
redireciona para `open-register` (ver spec de negócio
`03-regras-negocio.md`, seção Caixa). **Implementado** com route groups:
`(pos)/layout.tsx` exige sessão de operador; `(pos)/(operating)/layout.tsx`
exige caixa aberto e monta o `AppShell`; `(pos)/open-register/` fica fora de
`(operating)` e redireciona para `/` quando já há caixa aberto. Nenhuma
página repete a checagem.

## Estrutura de código

```
src/
  app/                     # rotas acima; cada page.tsx tem um use-<página>.ts colocado
                            # ao lado, só com a lógica de orquestração dessa tela
  components/
    ui/                    # Button, PillButton, Input, Select, Toggle, Modal, Avatar
    pos/                   # ProductCard, ProductGrid, CartLine, PaymentMethodPicker,
                            # PinKeypad, OperatorAvatarPicker, StatTile, PhotoUploadBox
    layout/                # AppShell, Sidebar, BottomNav, SplitAuthLayout
  hooks/
    queries/               # hooks de dado (TanStack Query) — use-products.ts,
                            # use-create-sale.ts... reusáveis por qualquer página
    use-cart.ts             # hooks compartilhados não-query (useCart, usePinInput)
  lib/
    api-client.ts          # client HTTP tipado, usa schemas de packages/shared
    navigation.ts           # lista única de itens de nav (ver 05-componentizacao.md)
    utils/                 # funções puras reutilizáveis (format-currency.ts, etc.) —
                            # nunca função solta dentro de um componente
    offline/
      db.ts                # Dexie — definição das tabelas locais
      sync.ts              # worker de sincronização da fila de vendas
  styles/
    theme.css              # tokens default (ver DESIGN_SYSTEM.md)
  stores/                  # Zustand — carrinho, sessão de PIN em progresso
cypress/
  e2e/                     # fluxos completos (login → abrir caixa → vender → fechar caixa)
  component/               # specs de componente (co-localizados como *.cy.tsx também é aceitável)
```

**Toda página é só view — a lógica vive num hook.** Três categorias, ver
`04-padroes-codigo.md` § Separação de lógica e UI para o padrão completo:
(1) hook de página (`use-<página>.ts`, colocado na mesma pasta do
`page.tsx`, só orquestração — nunca busca dado sozinho); (2) hook de dado
(`hooks/queries/`, sempre TanStack Query, é quem de fato chama a API); (3)
hook compartilhado não-query (`hooks/`, ex. `useCart`). Função pura vai
para `lib/utils/`, nunca inline num arquivo de componente.

## Carrinho e venda (implementado)

`stores/cart-store.ts` (Zustand) guarda itens, forma de pagamento, o `uuid`
da venda em andamento e a última venda concluída; `hooks/use-cart.ts` expõe
isso com total e contagem calculados por `lib/utils/cart.ts`. O `uuid` nasce
com o carrinho e é reusado em qualquer reenvio — a API é idempotente por
ele. "Finalizar Venda" sempre chama `POST /sales`; a API decide caixa
aberto, forma de pagamento e estoque. `INSUFFICIENT_STOCK` chega com
`details.productId` e a página destaca a `CartLine` correspondente, sem
recalcular estoque no cliente. Sucesso guarda a venda no store e navega
para `/sell/confirmed` (split layout, fora do `AppShell`); recarregar essa
tela sem venda recente volta para `/sell`. Enter na busca com um código de
barras exato adiciona o produto (leitor de código de barras).

## Formulários: padrão implementado (HU 10.1/10.3)

`hooks/use-product-form.ts` é o modelo para todo formulário: React Hook Form
sem resolver; o submit sempre chama a API; `apiFieldErrors()` mapeia
`details.fieldErrors` do 400 para `setError` em cada campo (nomes da API →
nomes do form, ex. `salePriceCents` → `salePrice`) e foca o primeiro; erro de
regra de negócio vai para `InlineAlert` via `apiGeneralErrorMessage()`.
`useSaveState()` dá ao `Button` os estados `loading` → `success` (~600ms)
antes de navegar. Valores monetários são digitados em reais e convertidos
para centavos só no submit (`lib/utils/money.ts`) — texto inválido vira
`NaN`/`null` e a API responde a mensagem do campo.

## Client HTTP (`lib/api-client.ts`)

- Toda chamada envia `x-tenant-host`: no browser é `window.location.host`;
  em Server Components é o `host` do request, junto com o cookie de sessão
  (`lib/server-headers.ts`, usado por `lib/tenant.server.ts` e
  `lib/session.server.ts`).
- **Só em desenvolvimento** o browser chama a API pela mesma origem
  (`NEXT_PUBLIC_API_URL=/api`, rewrite em `next.config.mjs` para
  `API_INTERNAL_URL`), porque `demo.app.localhost:3000` e `localhost:3001`
  são sites diferentes e o cookie `SameSite=Lax` não atravessaria. Em
  produção web e API compartilham o domínio pai e o rewrite não existe.

- Um único client tipado sobre `fetch`, que:
  - injeta o cookie de sessão automaticamente (`credentials: 'include'`);
  - lança um erro tipado (`ApiError`) quando a resposta não é 2xx, com o
    `code`/`message` que a API NestJS devolve — nunca engolir erro silenciosamente;
  - valida a resposta com o schema Zod de `packages/shared` correspondente
    antes de devolver pro componente (garante que um contrato quebrado na API
    falha de forma clara no frontend, não silenciosamente).
- Toda chamada de dado no app passa por TanStack Query (`useQuery`/`useMutation`)
  usando esse client — nunca `fetch` direto dentro de um componente de página.

## Offline (ver `01-arquitetura.md` para a estratégia completa)

- `lib/offline/db.ts`: tabelas Dexie — `productsCache`, `pendingSales`.
- Ao finalizar uma venda: grava em `pendingSales` com UUID gerado no
  cliente, atualiza a UI como concluída, dispara `sync.ts` em background.
- `sync.ts` roda: ao voltar a ficar online (`online` event), a cada N
  segundos como fallback, e a cada nova venda adicionada à fila. Remove da
  fila local só depois de confirmação 2xx da API.

## PWA

- Manifest e ícone da PWA usam nome/logo do **tenant** (não um nome fixo do
  produto) — gerado dinamicamente no `app/manifest.ts` do Next a partir do
  tenant resolvido no request, nunca um `manifest.json` estático com um nome
  hardcoded.
- Service worker (via `next-pwa`/Serwist): cachea shell da aplicação e
  catálogo de produtos; não cachea páginas de autenticação (sempre busca
  fresco, dado que login decide sessão).

## Testes (ver `04-padroes-codigo.md` para a régua geral)

- Component Testing (Cypress) em `components/ui` e `components/pos` — cobre
  interações (`PinKeypad` compõe dígitos corretamente, `Toggle` emite
  `onChange`, `PhotoUploadBox` aceita arquivo e chama `onChange`).
- E2E (Cypress) em `cypress/e2e/`, contra a API real de ambiente de teste,
  com um tenant de teste seedado. Fluxos obrigatórios: login → abrir caixa →
  vender (mínimo 1 produto) → fechar caixa; CRUD de produto; CRUD de
  operador incluindo a regra de "não pode remover o último admin".
