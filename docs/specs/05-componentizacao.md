# Componentização e Reuso

O protótipo de design (Claude Artifact) já provou o padrão que a implementação
real precisa seguir: os mesmos blocos visuais se repetem em Desktop, Tablet e
Celular, só o "shell" (sidebar vs. bottom-nav) muda. Componentização existe
para que isso seja escrito **uma vez**, não 3 vezes por breakpoint.

## Três camadas de componente

1. **`components/ui/`** — primitivos de design system, sem conhecimento de
   domínio: `Button`, `PillButton`, `Toggle`, `Input`, `Select`, `Modal`,
   `Avatar`. Estilizados via tokens de tema (ver 06), nunca com cor
   hardcoded. Construídos sobre Radix UI primitives para acessibilidade.
2. **`components/pos/`** — composição de domínio, reutilizando `ui/`:
   `ProductCard`, `ProductGrid`, `CartLine`, `PaymentMethodPicker`,
   `PinKeypad`, `OperatorAvatarPicker`, `StatTile`, `PhotoUploadBox`
   (usado tanto em Produto quanto em Operador — ver nota abaixo).
3. **`components/layout/`** — `AppShell`, `Sidebar`, `BottomNav`,
   `SplitAuthLayout` (o padrão de tela dividida usado em Login, Abertura de
   Caixa, Venda Confirmada).

Regra: um componente de `pos/` nunca deve saber se está rodando em desktop,
tablet ou celular — quem decide isso é o layout responsivo (Tailwind
breakpoints), não uma prop `variant="mobile"` espalhada pelo código.

## Responsivo, não 3 telas separadas

O protótipo de design tem arquivos `.dc.html` separados por breakpoint porque
é uma ferramenta de mockup estático. **Na implementação real isso não se
repete**: cada tela é UM componente React com Tailwind responsivo
(`sm:`/`md:`/`lg:`), não três componentes. Onde o layout muda estruturalmente
(sidebar no desktop/tablet vira bottom-nav no celular), isso é resolvido no
`AppShell` com CSS, não com JS de detecção de device.

## Exemplo do padrão de reuso: upload de foto

`Produto` e `Operador` usam exatamente a mesma caixa de upload vazia
(tracejada, ícone de câmera, texto "Adicionar foto", mesma altura do
formulário ao lado). Isso é um único componente:

```
components/pos/PhotoUploadBox.tsx
```

Props: `value: string | null`, `onChange: (file: File) => void`, `label?:
string` (default "Adicionar foto"). Nunca duplicar esse markup entre a tela
de Produto e a de Operador — se um dia o padrão visual mudar, muda em um
lugar só.

## Exemplo do padrão de reuso: shell de navegação

`AppShell` recebe a lista de itens de navegação (Vender, Produtos,
Fechamento, Dashboard, Operadores) e o item ativo, e decide sozinho:

- Acima de `lg`: sidebar expandida com label (padrão "Desktop" do protótipo).
- Entre `md` e `lg`: sidebar só com ícone (padrão "Tablet").
- Abaixo de `md`: bottom-nav flutuante (padrão "Celular").

Cada item de navegação (incluindo os ícones SVG) é definido **uma vez** numa
lista de configuração (`lib/navigation.ts`), nunca duplicado em três lugares.

## Storybook (opcional, mas recomendado)

Para os componentes de `ui/` e `pos/`, manter um Storybook (ou equivalente
leve) ajuda a garantir que a troca de tema (branding de outro mercado) não
quebra nada visualmente — é o lugar de revisar todos os componentes com o
tema trocado antes de revender para um novo cliente.
