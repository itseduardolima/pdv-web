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
```

Rotas (URLs) em inglês, como o resto do código (ver `04-padroes-codigo.md`,
seção Idioma); o título visível de cada tela continua em português.

Regra de navegação: se o operador logado não tem uma `CashSession` aberta e
tenta acessar `sell`, `products`, `closing`, `dashboard` ou `operators`,
redireciona para `open-register` (ver spec de negócio
`03-regras-negocio.md`, seção Caixa). Essa checagem é feita num
`layout.tsx`/middleware de rota, não repetida em cada página.

## Estrutura de código

```
src/
  app/                     # rotas acima
  components/
    ui/                    # Button, PillButton, Input, Select, Toggle, Modal, Avatar
    pos/                   # ProductCard, ProductGrid, CartLine, PaymentMethodPicker,
                            # PinKeypad, OperatorAvatarPicker, StatTile, PhotoUploadBox
    layout/                # AppShell, Sidebar, BottomNav, SplitAuthLayout
  hooks/                   # useCart, usePinInput, useCaixaAberto, etc.
  lib/
    api-client.ts          # client HTTP tipado, usa schemas de packages/shared
    navigation.ts           # lista única de itens de nav (ver 05-componentizacao.md)
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

## Client HTTP (`lib/api-client.ts`)

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
