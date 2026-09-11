# Padrões de Código

## Estrutura de pastas

```
src/
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
    api/                           # apenas o que Server Actions não cobre (webhooks, etc.)
    middleware.ts                  # resolução de tenant
  server/
    domain/
      venda/
      caixa/
      produto/
      operador/
    repositories/
      venda.repository.ts
      caixa.repository.ts
      produto.repository.ts
      operador.repository.ts
      tenant.repository.ts
    actions/
      venda.actions.ts
      caixa.actions.ts
      ...
  components/
    ui/                            # primitivos: Button, Input, PillButton, Toggle...
    pdv/                            # composto de domínio: ProductCard, CartLine, PinKeypad...
    layout/                         # Sidebar, BottomNav, AppShell
  lib/
  styles/
    theme.css                      # tokens default (ver 06)
prisma/
  schema.prisma
  migrations/
docs/
  specs/
```

Regra: **nada em `app/` fala com o Prisma diretamente.** Toda rota/Server
Action chama `server/actions/*`, que chama `server/domain/*` (regra de
negócio pura) e `server/repositories/*` (acesso a dado). Isso existe para que
uma regra de negócio (ex: "não pode vender com caixa fechado") seja testável
sem precisar simular uma requisição HTTP.

## Nomenclatura

- Arquivos de componente React: `PascalCase.tsx` (`ProductCard.tsx`).
- Arquivos de lógica/util: `kebab-case.ts` (`format-currency.ts`).
- Tipos e interfaces de domínio: `PascalCase`, sem prefixo `I` (`Produto`, não
  `IProduto`).
- Nomes de domínio **em português** (é o vocabulário do negócio: `Venda`,
  `Operador`, `Caixa`, `Produto`) — evita a tradução mental entre o que o
  cliente fala e o que o código diz. Nomes técnicos genéricos (hooks, utils
  de infraestrutura) em inglês, como é convenção do ecossistema (`useQuery`,
  `formatCurrency`).
- Componentes de UI genéricos (`Button`, `Toggle`, `Modal`) em inglês, porque
  não são vocabulário de negócio, são vocabulário de design system.

## TypeScript

- `strict: true` sempre. Não usar `any` — se o tipo é genuinamente
  desconhecido, usar `unknown` e narrow.
- Tipos de domínio vivem perto do domínio (`server/domain/produto/types.ts`),
  não num `types.ts` global genérico.
- Todo retorno de Server Action é um `Result<T>` explícito
  (`{ ok: true, data: T } | { ok: false, error: string }`) — nunca lançar
  exceção não tratada até o cliente; erros de validação de negócio são dado,
  não exceção.

## Formulários

- React Hook Form + Zod para todo formulário (Produto, Operador, Abertura de
  Caixa) — o mesmo schema Zod valida no cliente (feedback imediato) e no
  servidor (nunca confiar só na validação client-side).

## Commits

- Convenção: `tipo: descrição curta em português` — `feat: adiciona CRUD de
  produtos`, `fix: corrige cálculo de troco`, `refactor: extrai PinKeypad`.
- Tipos: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`.

## Testes

- `server/domain/**`: testado com Vitest, sem mockar banco (é lógica pura).
- Fluxos críticos end-to-end com Playwright: login → abrir caixa → vender →
  fechar caixa. Roda no CI antes de qualquer merge na branch principal.
- Não escrever teste para estilo/CSS — isso é validado visualmente, não por
  assert.

## O que NÃO fazer

- Não introduzir abstração para "caso genérico" antes de existir um segundo
  caso real (ex: não construir um "motor de regras" configurável para
  permissões — são só dois papéis, ver
  [03-regras-negocio](./03-regras-negocio.md)).
- Não hardcodar cor, nome do mercado, ou texto de marca em componente — tudo
  isso vem do tema do tenant (ver [06](./06-design-system-temas.md)).
- Não colocar `tenant_id` como parâmetro opcional em repositório — é sempre
  obrigatório e vem do contexto de request, nunca escolhido pela camada de UI.
