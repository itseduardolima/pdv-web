# Design System e Temas

> Detalhamento em nível de implementação (tokens completos, mapeamento para
> Tailwind, tabela de tipografia, do's/don'ts) vive em
> [`../../apps/web/docs/DESIGN_SYSTEM.md`](../../apps/web/docs/DESIGN_SYSTEM.md).
> Este documento aqui é o resumo de produto: o quê e o porquê do tema trocar
> por tenant. Fonte oficial do design system: **Aaply** —
> https://styles.refero.design/style/357e6fee-72db-40cf-b858-254b802018bd

## Base visual (design system "Aaply", herdado do protótipo)

- Cor primária (amarelo): `#e6e51e`
- Preto: `#000000`
- Cinza de fundo (canvas): `#f2f2f2`
- Azul de destaque: `#466cf3`
- Vermelho (alerta/excluir): `#f34646`
- Pêssego (destaque secundário): `#ff8562`
- Fontes: Poppins 700 (títulos, letter-spacing levemente negativo) + Inter
  (corpo/UI)
- Botões em pílula (`border-radius: 999px`), sempre em par amarelo+preto
  (primário/secundário)
- Cards com raio grande (24–40px)
- Sombra única, usada só em elementos de navegação:
  `rgba(0,0,0,0.2) 0px 10px 10px -5px`

Esses valores são o **tema default**, não uma constante fixa no código — ver
seção "Tokens de tema" abaixo.

## Tokens de tema (CSS variables)

Todo valor de cor de marca é uma CSS variable, definida em `:root` e
sobrescrita **em runtime** por tenant (não em build-time, porque uma mesma
instalação atende vários tenants ao mesmo tempo — ver
[07-multitenant-whitelabel](./07-multitenant-whitelabel.md)):

```css
/* src/styles/theme.css — valores DEFAULT, usados até o tenant carregar */
:root {
  --color-primary: #e6e51e;
  --color-primary-ink: #000000; /* cor do texto sobre o primário */
  --color-ink: #000000; /* texto principal */
  --color-canvas: #f2f2f2; /* fundo da aplicação */
  --color-surface: #ffffff; /* fundo de cards */
  --color-accent: #466cf3;
  --color-danger: #f34646;
  --color-warning: #ff8562;

  --radius-pill: 999px;
  --radius-card: 28px;
  --radius-card-sm: 20px;

  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;

  --shadow-nav: rgba(0, 0, 0, 0.2) 0px 10px 10px -5px;
}
```

O Tailwind config referencia essas variáveis (`theme.extend.colors.primary =
'var(--color-primary)'`), nunca um hex direto — assim toda classe
`bg-primary`, `text-ink` etc. já respeita o tema do tenant automaticamente,
sem precisar de rebuild por cliente.

## Como o tema do tenant é aplicado

1. Tabela `Tenant` no banco guarda: `name`, `slug`, `logoUrl`, `primaryColor`,
   `primaryInkColor` (opcional — se não informado, calcula contraste
   automaticamente no `TenantService`), `accentColor`.
2. No layout raiz (`app/layout.tsx`), o servidor resolve o tenant (pelo host,
   ver [01-arquitetura](./01-arquitetura.md)) e injeta um `<style>` inline
   com as CSS variables desse tenant, sobrescrevendo o default:

```tsx
<style>{`:root { --color-primary: ${tenant.primaryColor}; ... }`}</style>
```

3. Nome e logo do tenant (usados em `Sidebar`/`BottomNav`, título da aba,
   splash da PWA) vêm do mesmo registro — nunca hardcoded como "Mercadinho
   PDV" em nenhum componente.
4. **Administrador pode editar nome, logo e cores pela tela `/settings`
   (Sprint 7, HU 11.1–11.3)** — ao salvar (`PATCH /tenant/current`), a próxima
   request já reflete a mudança, sem cache (o `TenantService` lê o tema fresco
   a cada chamada de `GET /tenant/current`). `slug` e `domain` **não** são
   editáveis pela UI (quebrariam URLs/DNS); só o revendedor muda isso, editando
   o banco ou refazendo seed.

## Regra de acessibilidade ao trocar cor primária

Como a cor primária é escolhida por tenant, **nunca assumir que texto preto
sempre funciona sobre ela**. Calcular contraste (WCAG) ao salvar o tema no
admin de onboarding do tenant e avisar se a combinação for ilegível — ou
calcular `--color-primary-ink` automaticamente (preto ou branco, o que der
mais contraste) em vez de fixar preto.

## O que NUNCA é tema, é dado do domínio

Textos de UI (rótulos de campo, "Adicionar foto", "Salvar Operador") não são
"tema" — são fixos no código porque descrevem uma ação, não uma marca. O que
varia por tenant é: nome do negócio, logo, paleta de cor. Não confundir
i18n/copy com white-label — v1 é só português, um idioma.
