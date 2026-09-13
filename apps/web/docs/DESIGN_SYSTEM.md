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
- Escolha entre poucas opções fixas (categoria, unidade) usa `Select`
  — sem busca; buscar só se a lista crescer muito (dezenas de itens),
  decisão de produto de 2026-09-12 (categoria tinha um seletor com busca e
  texto livre; poucas categorias não justificavam isso, e escolher de uma
  lista curta é mais rápido num tablet de balcão do que digitar). `Select`
  é construído sobre `@radix-ui/react-select` (headless) com estilo
  próprio — nunca o `<select>` nativo do navegador, cujo menu de opções
  (cor, fonte, posição) o CSS não alcança e muda por sistema operacional.
  O gatilho (`Trigger`) usa o mesmo `ChevronDownIcon`, cor e posição em
  todo campo; o menu (`Content`, via portal) fica colado no gatilho —
  fundo `--color-surface`, `rounded-input`, `shadow-nav`, opção em foco/
  hover com `bg-primary`/`text-primary-ink`, igual ao resto do sistema.
- Campo com limite de caracteres (`maxLength`) trava a digitação nesse
  limite (o navegador não deixa passar, nem colando texto) e mostra um
  contador `atual/máximo` embaixo do campo, alinhado à direita, sempre —
  mesmo com erro. Os limites vêm de `packages/shared` (ex. `PRODUCT_LIMITS`).
  Só se aplica a campo de texto livre — um `Select` não precisa.
- Preço de venda usa máscara de dinheiro estilo calculadora: cada dígito
  novo entra pela direita ("1" "12" "123" → "0,01" "0,12" "1,23"), então
  colar um valor já formatado também funciona. Código de barras aceita só
  números — nunca deixa digitar letra, porque o padrão (EAN/UPC) é numérico.

### Cartão de total do dia/caixa — `TotalCard`, `TotalAmount`

Decisão de 2026-09-13, 100% fiel ao protótipo: `components/pos/TotalCard`
substitui o card duplicado que existia em Fechamento ("Total do caixa") e
Dashboard ("Vendido hoje") — mesmo fundo em degredê na cor do tenant, com
uma textura de pontinhos por cima (`radial-gradient` branco a 8% de
opacidade) e o brilho desfocado no canto inferior direito. `TotalAmount`
divide o valor formatado em partes: só o número inteiro ("612" em "R$
612,40") fica na cor primária da loja, o "R$" e os centavos continuam
brancos (herdam a cor do texto) — mesmo destaque do protótipo. O rodapé do
card é `children` (pill + texto no Fechamento, só texto no Dashboard), já
que cada tela mostra uma informação diferente ali.

### Vender: catálogo × carrinho por breakpoint

Decisão de 2026-09-13: o grid de produtos não pode crescer com a
quantidade de produtos — abaixo de `md` a página cresce livremente (sem
altura travada), então o container do catálogo leva `max-h-[46vh]` com
rolagem própria (`md:max-h-none` retoma o `flex-1` normal, que já é
travado pela altura fixa da tela a partir de `md` via `AppShell`).

A proporção catálogo/carrinho também muda por faixa: `md` (tablet
retrato/desktop pequeno) usa a proporção padrão (`flex-[2.3]`, grid de 3
colunas); `lg` (tablet **deitado**, antes do corte de desktop em `xl`)
inverte pra dar mais espaço ao carrinho (`flex-[1.4]` no catálogo,
`max-w-[420px]` no carrinho, grid continua em 3 colunas); `xl+` (desktop)
volta à proporção padrão e grid de 4 colunas.

### Ajustar estoque sem sair da venda — `QuickStockAdjust`

Quando a API recusa a venda por `INSUFFICIENT_STOCK`, o `InlineAlert` ganha
uma ação "Ajustar estoque" em linha própria abaixo do texto (nunca ao lado
— um nome de produto longo precisa de espaço pra quebrar sem espremer o
botão) — só para Administrador, que é quem pode editar produto. Clicar
abre `components/pos/QuickStockAdjust` **inline**, embaixo do próprio
aviso (mesmo padrão do bloco de troco `CashReceived`) — nunca um modal: um
`NumberStepper` rotulado com o nome do produto, já no estoque real
(`details.available` do erro — nunca inflado pra cobrir o que falta na
venda, quem decide o número certo é quem contou o produto) e
"Cancelar"/"Salvar". Salvar chama a mesma rota de editar produto (`PATCH
/products/:id`, só `stockQuantity`), fecha o painel e limpa o erro — o
operador clica "Finalizar Venda" de novo sem perder o carrinho nem sair da
tela. Sem essa ação (Operador, ou erro de outro tipo), o `InlineAlert`
continua só com o X de fechar.

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

### Valor recebido e troco — `CashReceived`

Só aparece no painel do carrinho quando a forma de pagamento é **Dinheiro**
(`components/pos/CashReceived`): um `Input` "Valor recebido" (prefixo `R$`,
máscara de dinheiro, opcional) sobre um bloco `--color-canvas` e, assim que
há valor, uma linha "Troco R$ X" em destaque (`font-heading`, 20px). Se o
digitado for menor que o total, a linha vira "Faltam R$ X" em
`--color-danger` — só orientação visual: o front **não bloqueia** o
Finalizar, quem recusa é a API (`INSUFFICIENT_CASH`), e a mensagem dela
aparece como erro do próprio campo, não como banner do carrinho. O campo
zera junto com o carrinho (cancelar / nova venda). "Venda Confirmada" mostra
"Recebido" e "Troco" abaixo do total, e o Histórico de Vendas acrescenta
"· troco R$ X" na linha da venda em dinheiro que teve troco.

### Operadores — `Toggle`, `OperatorCard`, `OperatorForm`

- `components/ui/Toggle`: interruptor em pílula (`role="switch"`,
  `aria-checked`, `aria-label` obrigatório), `--color-primary` ligado,
  `--color-border` desligado. Só o `active` de operador usa hoje.
- `components/pos/OperatorCard`: avatar (`Avatar`, iniciais ou foto), nome,
  papel em **texto simples** (HU 6.1 — não é badge), toggle de ativo e
  lápis para editar. Inativo fica com 60% de opacidade e "· inativo" no
  papel. Uma linha no celular, card em duas colunas a partir de `md`.
- `components/pos/OperatorForm`: grade de **altura natural** (nada estica
  até o rodapé): foto (`PhotoUploadBox` kind `operator`) à esquerda, dados
  à direita, botão "Salvar Operador" logo abaixo do último campo. O PIN só
  existe na criação (`withPin`, dividindo a linha com o Papel); na edição o
  Papel ocupa a largura toda e o PIN é trocado no slot `after` (bloco
  "Resetar PIN", formulário próprio, botão preto "Salvar PIN" → "PIN
  salvo"), que fica abaixo dos dados na coluna da direita. Excluir não fica
  no cabeçalho: vai para o slot `asideExtra` ("Zona de risco", card abaixo
  da foto, botão ghost em `--color-danger`). No celular a ordem é foto,
  dados, PIN, excluir. O campo de PIN é `type="password"`, só dígitos,
  `maxLength` 4.
- Erros de regra (`LAST_ADMIN`, `SELF_CHANGE`) chegam da API e aparecem
  como `InlineAlert` acima da lista (toggle) ou do formulário (editar /
  excluir). A tela nunca esconde o toggle do próprio usuário nem do último
  admin — quem decide é a API.

### PIN por e-mail — `/forgot-pin`, `/set-pin`, cadastro de operador

- Login ganha o link discreto "Esqueci meu PIN" abaixo de "Entrar".
  `/forgot-pin` (mesmo `SplitAuthLayout`) pede só o e-mail e, enviado,
  mostra sempre a mesma confirmação ("se houver um cadastro ativo com
  esse e-mail…") — nunca diz se existe.
- `/set-pin?token=` reaproveita o `PinKeypad` do Login: "Bem-vindo ao
  caixa" no primeiro acesso, "Novo PIN" na redefinição. Link inválido vira
  `InlineAlert` com a mensagem da API e botão "Pedir um novo link"; a tela
  não tem texto próprio de erro (sem token ela consulta a API do mesmo
  jeito).
- Cadastro de operador: campo E-mail entre Nome e Papel. O `*` de
  obrigatório é dinâmico e só visual: E-mail marca quando Papel =
  Administrador, PIN inicial marca quando E-mail está vazio; o `hint`
  explica o porquê. Quem valida é a API.
- `OperatorCard` mostra a pílula "Primeiro acesso pendente" (`--color-warning`
  a 15%) enquanto `hasPin` é falso. Na edição, o bloco abaixo dos dados é
  "Esqueceu o PIN?" / "Primeiro acesso" com botão preto de enviar link
  quando há e-mail, e o "Resetar PIN" manual só quando não há.

### Ponto de corte tablet × desktop — `lg` não basta

Decisão de 2026-09-13: iPad e tablets Android deitados passam de 1024px
(o `lg` padrão do Tailwind), então usar `lg:` pra "é desktop" fazia telas
de tablet deitado mostrarem sidebar expandida com rótulo e a ilustração da
`SplitAuthLayout` — exatamente o que devem evitar. As duas usam `xl:`
(1280px) como o corte real de desktop:

- `Sidebar`: ícone só até `xl` (tablet, retrato ou paisagem); ícone +
  rótulo só a partir de `xl`.
- `SplitAuthLayout`: ilustração escondida até `xl`; o painel fica largura
  cheia até lá (sem a faixa lateral fixa de 540px) — sem ilustração do
  lado, a largura cheia aproveita melhor o tablet do que ficar com metade
  da tela em branco.

### Login com muitos operadores — `OperatorAvatarPicker`

Além da rolagem própria, a grade encolhe automaticamente a partir de 8
operadores (`COMPACT_THRESHOLD`): avatar de 36px (era 56px), fonte de
10px (era 12px) e menos espaço entre os itens — cabem mais operadores
visíveis por vez antes de precisar rolar.

Decisão de 2026-09-12: a grade de avatares (mantém o visual do protótipo)
ganhou altura máxima (`max-h-[248px]`) com rolagem própria e cada item
ganhou largura fixa — o nome vira uma linha só, truncado com reticências
(`truncate`, título completo no `title` do botão). Sem isso, equipe grande
ou nome comprido empurravam o teclado de PIN pra fora da tela; agora ele
fica sempre logo abaixo da grade, do mesmo tamanho, não importa quantos
operadores a loja tenha.

### Calculadora — `Calculator`, `CalculatorDialog`

Botão de calculadora no cabeçalho de Vender (decisão de 2026-09-13, à
esquerda do badge "Caixa #N", ícone estático `public/icons/calculator.svg`
— mesmo padrão de asset do protótipo que `PaymentMethodIllustration` já
usa): cliente às vezes quer dividir a conta, o operador precisa de uma
conta rápida sem sair da venda. `Calculator` (em `components/ui`, não
`pos` — não tem nada a ver com carrinho, venda ou produto, é só uma
ferramenta solta) usa lógica pura em `lib/utils/calculator.ts`: soma,
subtração, multiplicação, divisão, `C`/apagar, erro em divisão por zero
(nunca quebra a tela) e **encadeamento sem prioridade de operador,
esquerda pra direita** — igual à calculadora do iPhone (`2+3×4` dá `20`,
não `14`). O visor mostra a conta inteira enquanto o operador digita
("8+2+2×3"), não só o número atual — sem isso o sinal clicado "sumia" da
tela. `CalculatorDialog` embrulha isso num `Dialog` do Radix com o overlay
desfocado (`backdrop-blur-sm`, diferente do `ConfirmDialog` comum — aqui
o conteúdo atrás faz sentido continuar visível, só borrado). Sem ligação
nenhuma com o total da venda.

### Filtro por categoria — `CategoryFilter`

Chips roláveis na horizontal até `lg` ("Todas" + `DEFAULT_PRODUCT_CATEGORIES`
mais o que a loja já usa, via `useProductCategories`); a partir de `xl`
(desktop de verdade — mesmo corte de `Sidebar`/`SplitAuthLayout`) vira um
select de opção única com rótulo "Filtrar por:" ao lado (decisão de
2026-09-13 — numa tela larga, uma fileira de chips ocupa espaço à toa e um
select fica mais compacto e alinhado ao resto do cabeçalho). **Um
componente reusado** em `Produtos` (filtra a busca no servidor, `GET
/products?category=`) e em `Vender` (filtra em memória a lista já
carregada, junto com a busca por texto — o grid do caixa precisa da lista
inteira de qualquer forma, para o leitor de código de barras funcionar).
Selecionado (chip) fica `bg-primary`, o resto `bg-surface` com borda
`--color-border`. A fileira de chips leva `shrink-0` — item flex com
`overflow-x-auto` perde o tamanho mínimo automático (vira 0) e sem isso
fica espremido a quase nada dentro da coluna da página.

### Dashboard — `WeekChart`, `TopProductRow`

- Cabeçalho da tela repete o padrão do Fechamento: cartão escuro
  (`color-mix` de `--color-ink` com a primária) com "Vendido hoje" e o
  número de vendas, mais três `StatTile` por forma de pagamento com
  `PaymentMethodIllustration` e "% do total".
- `components/pos/WeekChart`: gráfico dos últimos 7 dias em **SVG puro**
  (sem lib, HU 7.3). Uma barra por dia, altura proporcional ao melhor dia
  (`lib/utils/chart.ts` → `scaleBars`), `fill-primary` no dia de hoje,
  `fill-primary/45` nos outros, `fill-border` em traço fino quando não houve
  venda. Rótulos: dia da semana abreviado (hoje em negrito) e, a partir de
  `md`, o valor do dia. Cor vem do token — trocar o tema troca o gráfico.
- `components/pos/TopProductRow`: posição, foto (ou ícone de produto), nome
  congelado na venda, "N vendidos" e valor. Lista `<ol>` dividida por
  `--color-border`; sem venda hoje vira `EmptyState size="sm"`.
- Os dias vêm da API como `YYYY-MM-DD` no fuso da loja; o front formata com
  `parseDayKey` (meio-dia local) para nunca exibir o dia anterior.

### Estado vazio — `EmptyState`

Toda lista/grid sem conteúdo usa `components/ui/EmptyState` (`title`,
`description?`, `action?`, `size` `md`/`sm`, `illustration` `box`/`cart`),
nunca um `<p>` solto. As ilustrações (SVG inline) pintam só o elemento
principal com a cor do tenant, sempre nas mesmas três variações —
`--color-primary` no traço/face principal, `color-mix(... ~80%, black)` no
contorno mais escuro, `color-mix(... ~60%, white)` no detalhe mais claro
(aba da caixa, trançado da cesta); interior e fundo continuam neutros. Nada
de hex fixo — trocar o tema troca a ilustração.

- `EmptyBoxIllustration` (`illustration="box"`, padrão): caixa vazia,
  usada em listas gerais (Produtos, grid de Vender, Histórico de Vendas).
- `EmptyCartIllustration` (`illustration="cart"`): carrinho vazio, usada
  só no carrinho da tela Vender.

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
