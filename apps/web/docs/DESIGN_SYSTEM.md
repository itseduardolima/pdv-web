# Design System — apps/web

Fonte oficial do design system: **Aaply** —
https://styles.refero.design/style/357e6fee-72db-40cf-b858-254b802018bd

Referência visual aplicada (telas reais, nos 3 breakpoints): protótipo
clicável publicado em
https://claude.ai/code/artifact/b115bb97-13a7-46a8-9550-6e63cce98f10 — é
ele que mostra como cada token abaixo aparece de fato em Login, Vender,
Produtos, Operadores, etc. Use-o para tirar dúvida de estado/layout que este
documento não detalha (ex.: exatamente onde o dot-grid aparece, o espaçamento
de um card específico).

Este documento traduz esse design system em tokens de código (CSS
variables + Tailwind) e define como eles são consumidos pelos componentes.
Contexto de produto sobre _por que_ o tema precisa trocar por tenant está em
[`../../docs/specs/06-design-system-temas.md`](../../docs/specs/06-design-system-temas.md)
— aqui é o "como", concreto, dentro de `apps/web`.

## Duas camadas de token: primitivo → semântico

**Nunca** usar um valor primitivo (hex, px) direto num componente. Todo
componente consome um token **semântico**; o token semântico é que aponta
para um primitivo (o valor default do Aaply) ou para o valor customizado do
tenant.

```
primitivo (Aaply, fixo)  →  semântico (troca por tenant)  →  componente
--color-highlighter-yellow: #e6e51e  →  --color-primary  →  <PillButton variant="primary">
```

## Tokens primitivos (valores default — do design system Aaply)

### Cor

| Token primitivo              | Hex       | Papel no Aaply                    |
| ---------------------------- | --------- | --------------------------------- |
| `--color-highlighter-yellow` | `#e6e51e` | Acento de marca primário          |
| `--color-sunbeam`            | `#fff705` | Amarelo mais vibrante, destaques  |
| `--color-annotation-red`     | `#f34646` | Callout/ênfase (perigo, excluir)  |
| `--color-signal-blue`        | `#466cf3` | Acentos secundários, conectores   |
| `--color-peach-wash`         | `#ff8562` | Fundos com tinta suave            |
| `--color-carbon`             | `#000000` | Texto principal, UI escura        |
| `--color-paper-white`        | `#ffffff` | Superfície de cards               |
| `--color-graphite-mist`      | `#f2f2f2` | Fundo de página (canvas)          |
| `--color-hairline-gray`      | `#e6e6e6` | Bordas, divisores                 |
| `--color-shadow-gray`        | `#cccccc` | Base da sombra (20% de opacidade) |

### Tipografia

- **Display/Headings**: Poppins (400, 500, 700) — fallback DM Sans, Nunito Sans
- **Body/UI**: Inter (300, 400, 500, 700) — fallback system-ui, -apple-system, Segoe UI

| Papel      | Tamanho | Peso | Line-height | Letter-spacing | Uso no PDV                                                      |
| ---------- | ------- | ---- | ----------- | -------------- | --------------------------------------------------------------- |
| Display    | 57px    | 700  | 1.05        | -4.22px        | Não usado (é escala de marketing/landing, não de UI de produto) |
| Heading LG | 52px    | 700  | 1.0         | -3.85px        | Não usado no PDV                                                |
| Heading    | 34px    | 500  | 1.05        | -0.65px        | `page-title` desktop (ex.: "Editar Produto")                    |
| Heading SM | 27px    | 500  | 1.33        | -0.49px        | `page-title` tablet/celular                                     |
| Subheading | 18px    | 400  | 1.4         | -0.5px         | Subtítulo de tela (`page-sub`), nome em destaque                |
| Body       | 16px    | 400  | 1.53        | —              | Texto de input, item de lista                                   |
| Caption    | 14px    | —    | 1.57        | —              | Labels de campo, texto auxiliar                                 |

Nota: a escala do Aaply é pensada para landing/marketing (por isso "Display"
e "Heading LG" não aparecem em nenhuma tela do PDV — são grandes demais para
UI de produto). O PDV usa Heading/Heading SM para títulos de tela e
Body/Caption para o resto — ver mapeamento de componentes abaixo.

### Espaçamento e layout

- Page max-width: `1200px` (referência de marketing; nas telas de produto o
  `AppShell` ocupa a largura toda — não aplicar esse max-width ao PDV)
- Gap entre seções: `80–120px` (marketing); no PDV, usar a escala de
  componente (ver `--space-*` abaixo)
- Padding de card: `32–48px` (mockups); no PDV os cards de tela usam
  `22–30px` conforme o breakpoint — ver tokens de componente
- Densidade: confortável, não compacta — não espremer inputs/botões para
  caber mais na tela

### Raio (border-radius)

| Elemento                       | Valor                                          |
| ------------------------------ | ---------------------------------------------- |
| Botões                         | `3000px` (= pílula, `999px` na prática de CSS) |
| Tags                           | `3000px`                                       |
| Navegação (sidebar/bottom-nav) | `30px`                                         |
| Cards                          | `30–40px`                                      |
| Inputs                         | `16px`                                         |
| Frame de produto/imagem        | `16px`                                         |

### Sombra

Sistema de **sombra única** — nunca empilhar sombras.

- `--shadow-nav: rgba(0, 0, 0, 0.2) 0px 10px 10px -5px`
- Aplicada **somente** em elementos de navegação (sidebar, bottom-nav). Cards
  de conteúdo não têm sombra — usam só o contraste contra o `--color-canvas`.

## Tokens semânticos (o que o componente de fato usa)

Definidos em `src/styles/theme.css`, valor default = primitivo Aaply
correspondente; **sobrescritos em runtime por tenant** (injeção de `<style>`
no layout raiz, resolvido a partir do tenant — ver
[`06-design-system-temas.md`](../../docs/specs/06-design-system-temas.md)).

```css
:root {
  /* cor — semântico → primitivo Aaply */
  --color-primary: var(--color-highlighter-yellow);
  --color-primary-ink: var(--color-carbon); /* texto sobre o primário */
  --color-ink: var(--color-carbon);
  --color-canvas: var(--color-graphite-mist);
  --color-surface: var(--color-paper-white);
  --color-border: var(--color-hairline-gray);
  --color-accent: var(--color-signal-blue);
  --color-danger: var(--color-annotation-red);
  --color-warning: var(--color-peach-wash);

  /* raio */
  --radius-pill: 999px;
  --radius-card: 32px; /* 30–40px do Aaply, 32px é o ponto médio usado */
  --radius-card-sm: 20px;
  --radius-input: 16px;
  --radius-frame: 16px;
  --radius-nav: 30px;

  /* sombra */
  --shadow-nav: rgba(0, 0, 0, 0.2) 0px 10px 10px -5px;

  /* tipografia */
  --font-heading: 'Poppins', 'DM Sans', 'Nunito Sans', sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  /* espaçamento de componente (não é a escala de marketing do Aaply —
     é a escala real usada nas telas do PDV, calibrada durante o protótipo) */
  --space-card-padding-desktop: 30px;
  --space-card-padding-tablet: 22px;
  --space-card-padding-mobile: 16px;
  --space-gap-sm: 8px;
  --space-gap-md: 16px;
  --space-gap-lg: 24px;

  /* altura de controle (input/select/botão de teclado) */
  --control-height-desktop: 54px;
  --control-height-tablet: 48px;
  --control-height-mobile: 46px;
}
```

**Regra**: um componente nunca referencia `--color-highlighter-yellow`
direto — sempre `--color-primary`. Isso é o que permite o tenant sobrescrever
só as variáveis semânticas sem tocar nos primitivos do Aaply (que
permanecem como "o tema default", documentando de onde a paleta original
veio).

## Tailwind: como os tokens chegam nas classes

Tailwind não sabe reavaliar CSS variable dentro de uma classe utilitária
comum (`bg-yellow-400` é uma cor fixa compilada). Duas regras:

1. **`tailwind.config.ts` mapeia cor semântica para a CSS variable**, não
   para o hex:

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-ink': 'var(--color-primary-ink)',
        ink: 'var(--color-ink)',
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        card: 'var(--radius-card)',
        'card-sm': 'var(--radius-card-sm)',
        input: 'var(--radius-input)',
        frame: 'var(--radius-frame)',
        nav: 'var(--radius-nav)',
      },
      boxShadow: { nav: 'var(--shadow-nav)' },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
    },
  },
}
```

Com isso, `bg-primary`, `text-ink`, `rounded-pill`, `shadow-nav` **já
respeitam o tenant automaticamente** — a classe é estática (Tailwind
compila normalmente, nada de purge quebrado), só o valor que a CSS variable
resolve é que muda em runtime.

2. **Nunca gerar nome de classe Tailwind dinamicamente** a partir de dado do
   tenant (ex.: `` `bg-${tenant.corPrimaria}` ``) — o Tailwind precisa ver a
   classe como string literal em tempo de build para não fazer purge dela.
   Se um dia for necessário um valor verdadeiramente arbitrário fora dos
   tokens acima, usar sintaxe arbitrária apontando pra variável
   (`bg-[var(--color-primary)]`), nunca interpolação de valor.

## Mapeamento de componente (do Aaply para o que existe no PDV)

| Componente Aaply          | Componente no código                                                                   | Onde                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Filled Yellow Pill Button | `<Button variant="primary">`                                                           | `components/ui/Button.tsx` — bg `primary`, texto `primary-ink`, `rounded-pill`, padding `16px 32px`, Inter 500 16px |
| Filled Black Pill Button  | `<Button variant="secondary">`                                                         | bg `ink`, texto `surface`                                                                                           |
| Ghost Pill Button         | `<Button variant="ghost">`                                                             | transparente, borda 1px `ink`, texto `ink`, Inter 500 15px, padding `12px 24px`                                     |
| Navigation Bar Card       | `AppShell` → `Sidebar` / `BottomNav`                                                   | única aplicação de `shadow-nav`, `rounded-nav`                                                                      |
| Annotation Tag            | não usado como "tag" — usado como `<Button variant="danger">`/badge de ação destrutiva | cor `danger`                                                                                                        |
| Avatar Stack              | `Avatar` (uso individual, não stack, no PDV)                                           | `components/ui/Avatar.tsx`                                                                                          |

Regra dura de pareamento (do próprio Aaply, "Don'ts"): **botão amarelo e
botão preto sempre em par** (ex.: "Salvar" amarelo + "Cancelar" preto) —
nunca dois amarelos ou dois pretos lado a lado no mesmo par de ação.

## Do's / Don'ts (herdados do Aaply, aplicados ao PDV)

**Fazer:**

- Usar raio de pílula (`rounded-pill`) em todo elemento interativo (botão,
  toggle, chip).
- Manter contraste máximo: texto `--color-ink` (preto) sobre superfícies
  claras — nunca cinza-sobre-cinza de baixo contraste.
- Aplicar o padrão de dot-grid (fundo pontilhado) só onde o protótipo já
  define isso: telas de split-screen (Login, Abertura de Caixa) no lado da
  ilustração.

**Não fazer:**

- Não empilhar sombras — `--shadow-nav` é a única sombra do sistema, e só em
  navegação.
- Não introduzir cor fora da paleta de 5 acentos+neutros acima sem atualizar
  este documento primeiro (uma cor nova precisa de justificativa de produto,
  não é escolha estética pontual de uma tela).
- Não usar peso de fonte fino (300) em título — Aaply reserva peso leve só
  para texto secundário do body.
- Não separar o par de botão amarelo/preto (ver regra de pareamento acima).

## Validação e feedback ao usuário

O protótipo (mockup estático) não cobre estado de erro nem feedback de
ação — isso precisa existir na implementação real. Decisão de produto:
**nunca usar toast** (notificação flutuante que aparece e desaparece por
conta própria, alheia ao card com que o usuário está interagindo). Em vez
disso, dois padrões, sempre ancorados ao componente que gerou a ação —
o feedback aparece _onde o olho já está_, não num canto da tela que o
Operador pode nem ver num tablet no meio de um atendimento.

### 1. Erro de campo (validação de formulário)

A validação é sempre da API — o frontend não tem regra própria, ver
`04-padroes-codigo.md` § Formulários. Fluxo: o submit chama a API; se ela
responder 400 (`code: "VALIDATION"`), o formulário lê `details.fieldErrors`
e aplica em cada campo correspondente. Nada é validado antes desse retorno.

- Borda do input muda para `--color-danger` (2px) + ícone de alerta dentro
  do campo, à direita.
- Mensagem **abaixo do próprio campo** — exatamente o texto que a API
  devolveu, sem reescrever — `--color-danger`, Inter 500 12px,
  `margin-top: 4px`. Nunca um resumo genérico de erros no topo do
  formulário.
- O primeiro campo com erro recebe foco automaticamente depois da resposta.
- Enquanto a API responde, o botão de submit entra em `state="loading"`
  (ver componente `Button` abaixo) — não existe estado "inválido" antes
  disso, porque não existe validação antes disso.

```
Nome completo
[___________________________]  ← borda vermelha, ícone de alerta
Informe o nome completo
```

### Texto de apoio, obrigatório e ajuda

- Todo campo tem `hint` (texto de apoio abaixo, `--color-ink` a 45%, 12px)
  com o que o usuário precisa saber antes de digitar: limites (vindos de
  constantes de `packages/shared`, ex. `PRODUCT_LIMITS`), formato e um
  exemplo. O `hint` some enquanto houver erro no campo — o erro ocupa o
  lugar dele.
- Campo obrigatório leva `*` em `--color-danger` ao lado do rótulo
  (`FieldLabel required`), com "(obrigatório)" só para leitor de tela.
- Escolha que exige conhecimento (ex.: unidade de medida) tem um botão
  "Qual escolher?" ao lado do rótulo que abre um balão (Radix Popover) com
  uma frase simples por opção — texto em `PRODUCT_UNIT_INFO`, nunca inline.
- Lista longa de opções (categoria) usa `Combobox`: digitar filtra, Enter ou
  clique escolhe, texto novo continua válido.

### 2. `InlineAlert` — erro de regra de negócio / ação bloqueada

Substitui completamente o toast para erros que vêm da API (regra de
negócio: `CASH_SESSION_ALREADY_OPEN`, `INSUFFICIENT_STOCK`,
`LAST_ADMIN`, etc.) e para avisos que não são erro de um campo específico.

- Um banner que nasce **dentro do próprio card/painel** onde a ação foi
  disparada (não sobrepõe a tela, não flutua sobre outros elementos) —
  ocupa a largura do card, `border-radius: var(--radius-card-sm)`, fundo
  `--color-danger` a 8% de opacidade, texto e ícone em `--color-danger`
  sólido, padding `12px 16px`, entra com um slide-down + fade de ~150ms.
- Fica **acima do elemento que causou o erro** (ex.: acima do botão
  "Finalizar Venda", dentro do próprio painel de carrinho) — o usuário nunca
  precisa procurar o que aconteceu.
- Não desaparece por conta própria quando é bloqueante (ex.: estoque
  insuficiente) — só quando o usuário corrige a causa (ajusta a quantidade)
  ou dispensa manualmente (X no canto). Quando é só um aviso não bloqueante,
  pode ter um botão "Entendi" que fecha o banner.
- Variante de aviso (não erro): mesma estrutura, fundo `--color-warning` a
  10%, ícone diferente (ex.: estoque baixo ao adicionar um produto — aviso,
  não impede a venda).

```
┌ Painel do carrinho ───────────────────────┐
│ ⚠ Estoque insuficiente: só há 3 unidades   │
│   de "Cerveja Lata 350ml" em estoque.       │
├─────────────────────────────────────────────┤
│  Item 1                                      │
│  Item 2                                      │
│  ...                                         │
│  [ Finalizar Venda ]                         │
└───────────────────────────────────────────────┘
```

### Estado vazio — `EmptyState`

Toda lista/grid sem conteúdo usa `components/ui/EmptyState` (`title`,
`description?`, `action?`, `size` `md`/`sm`), nunca um `<p>` solto. A
ilustração (`EmptyBoxIllustration`, SVG inline) pinta **só a caixa** com a
cor do tenant: topo em `--color-primary`, lateral em
`color-mix(... 82%, black)` e abas em `color-mix(... 65%, white)`; interior
e fundo continuam neutros. Nada de hex fixo — trocar o tema troca a caixa.

### 3. Sucesso — sem banner nenhum, o próprio fluxo já confirma

Em vez de "salvou, mostra um toast de sucesso", a confirmação é o próprio
próximo estado da tela — mais agradável que uma notificação que pisca e
some, porque o usuário não precisa nem processar uma mensagem extra:

- **Ações de navegação natural** (finalizar venda, abrir caixa): o
  protótipo já resolve isso — vai para a tela seguinte (Venda Confirmada,
  Vender). Manter esse padrão para toda ação equivalente; nunca adicionar um
  toast "Venda registrada!" por cima de uma tela que já é a confirmação.
- **Ações que ficam na mesma tela** (salvar Produto, salvar Operador,
  fechar um Modal de edição): o botão de ação faz uma transição de estado
  inline — vira um ícone de check + label ("Salvo") por ~600ms, com um
  micro-scale (1 → 1.05 → 1), e só então a tela volta para a lista/fecha o
  modal. Nada aparece fora do botão que o usuário já está olhando.

```
[ Salvar Produto ]   →   [ ✓ Salvo ]   →   (volta para a lista)
```

- Componente: `<Button variant="primary" state="idle|loading|success">` —
  o próprio `Button` de `components/ui` já modela esse ciclo, não é um
  componente novo de notificação.

### Por que este padrão em vez de toast

Toast exige que o Operador — que está de olho no produto/dinheiro/cliente,
não na tela — note algo que aparece e desaparece num canto sozinho. Ancorar
o feedback no componente que originou a ação (o campo, o card, o próprio
botão) garante que ele está exatamente onde o olho já está no momento em
que o erro ou a confirmação acontece.
