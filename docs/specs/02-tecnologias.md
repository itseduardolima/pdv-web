# Tecnologias

Escolhas feitas priorizando: time pequeno, custo baixo de hospedagem, um único
código para desktop/tablet/celular, e a possibilidade de operar offline no
caixa.

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR + API + PWA num único deploy; React já é o que o protótipo de design pressupõe |
| Linguagem | TypeScript (strict) | Tipagem de domínio (produto, venda, operador) evita boa parte dos bugs de PDV (troco, estoque) |
| Estilo | Tailwind CSS + CSS variables para tema | Tailwind pelo ritmo de desenvolvimento; CSS vars porque o tema (cor/nome) precisa trocar em runtime por tenant, não em build — ver [06](./06-design-system-temas.md) |
| Componentes base | Radix UI primitives (headless) | Acessibilidade (foco, teclado, aria) de graça; estilizamos por cima com nosso design system, sem herdar um visual de terceiro |
| Estado servidor | TanStack Query | Cache, refetch, e principalmente: estratégia de retry/offline que combina bem com Service Worker |
| Estado local (UI) | Zustand | Carrinho em progresso, teclado de PIN, estado de formulário — sem boilerplate de Context |
| Offline storage | Dexie (wrapper de IndexedDB) | Fila de vendas pendentes de sincronizar, cache de catálogo |
| PWA | `next-pwa` (ou Serwist) | Service worker, instalável, ícone do tenant |
| ORM / banco | Prisma + PostgreSQL | Migrations versionadas, tipos gerados a partir do schema |
| Auth | Sessão própria via cookie httpOnly + PIN hasheado (argon2) | PIN de 4-6 dígitos não é senha forte — mitiga com hashing, rate-limit de tentativas e sessão de operador por tenant |
| Upload de imagem | Cloudflare R2 (ou Supabase Storage) via URL assinada | Fotos de produto/operador e logo do tenant nunca em base64 no banco |
| Testes | Vitest (unit, `src/server/domain`) + Playwright (E2E dos fluxos críticos: abrir caixa → vender → fechar caixa) | Regra de negócio testada isolada de HTTP; fluxo completo testado de ponta a ponta |
| Lint/Format | ESLint + Prettier (config única, sem exceção por pasta) | Consistência entre desktop/tablet/celular no mesmo código |
| CI | GitHub Actions (lint + typecheck + testes em cada PR) | Barato e já integrado ao repo |
| Hospedagem | Vercel | Deploy trivial de Next.js, edge middleware para resolução de tenant |

## Coisas que optamos por NÃO usar (e por quê)

- **App nativo (React Native/Flutter)**: descartado — o objetivo é um único
  código cobrindo os 3 tamanhos sem loja de app; PWA resolve instalação e
  offline sem esse custo. Ver decisão em [00-visao-geral](./00-visao-geral.md).
- **Monorepo com backend separado (NestJS, etc.)**: descartado por ora — v1 é
  simples demais para justificar dois deploys; a camada `src/server/domain`
  já isola a lógica de negócio caso precise extrair depois.
- **Redux**: Zustand cobre o caso de uso com muito menos boilerplate; não há
  necessidade de time-travel debugging ou middleware complexo aqui.
