'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDownIcon } from '@/components/ui/Icons'

interface CategoryFilterProps {
  categories: string[]
  // null = "Todas"
  value: string | null
  onChange: (category: string | null) => void
  className?: string
}

// Sentinela interno só pro Radix (Select.Item não aceita value=""); nunca
// sai pra fora do componente — onChange sempre devolve null pra "Todas".
const ALL_VALUE = '__all__'

// Chips de categoria até `lg` (rolam na horizontal); a partir de `xl`
// (desktop de verdade — mesmo corte de Sidebar/SplitAuthLayout) vira um
// select de opção única, mais compacto que uma fileira de chips numa tela
// larga (decisão de 2026-09-13). Mesmo componente em Produtos (filtra a
// lista) e Vender (filtra o grid de venda), 05-componentizacao. "Todas"
// sempre primeiro; o resto vem de DEFAULT_PRODUCT_CATEGORIES + o que a
// loja já usa (useProductCategories), então nunca aparece vazio.
export function CategoryFilter({ categories, value, onChange, className = '' }: CategoryFilterProps) {
  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="Filtrar por categoria"
        // shrink-0: um item flex com overflow não-visible perde o tamanho
        // mínimo natural (vira 0 no eixo principal) e é espremido pelo
        // resto da coluna — sem isso a fileira de chips quase desaparece.
        className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden"
      >
        <Chip label="Todas" selected={value === null} onClick={() => onChange(null)} />
        {categories.map((category) => (
          <Chip key={category} label={category} selected={value === category} onClick={() => onChange(category)} />
        ))}
      </div>

      <div className="hidden items-center gap-2.5 xl:flex">
        <span className="font-body text-[13px] font-medium text-ink/50">Filtrar por:</span>
        <RadixSelect.Root
          value={value ?? ALL_VALUE}
          onValueChange={(next) => onChange(next === ALL_VALUE ? null : next)}
        >
          <RadixSelect.Trigger
            aria-label="Filtrar por categoria"
            className="flex h-10 items-center gap-2 rounded-pill border-[1.5px] border-border bg-surface px-4 font-body text-[13px] font-medium text-ink outline-none data-[state=open]:border-primary"
          >
            {/* Children explícitos: mostra certo já no primeiro render, sem
                depender do menu ter aberto uma vez para "aprender" o rótulo
                (categoria é o próprio valor, sem mapa de label). */}
            <RadixSelect.Value>{value ?? 'Todas'}</RadixSelect.Value>
            <RadixSelect.Icon className="shrink-0">
              <ChevronDownIcon aria-hidden width="14" height="14" className="text-ink/50" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={4}
              className="z-20 max-h-64 overflow-hidden rounded-input border border-border bg-surface shadow-nav"
            >
              <RadixSelect.Viewport className="p-1">
                <RadixSelect.Item
                  value={ALL_VALUE}
                  className="cursor-pointer select-none whitespace-nowrap rounded-frame px-3 py-2 font-body text-sm text-ink outline-none data-[highlighted]:bg-primary data-[highlighted]:text-primary-ink"
                >
                  <RadixSelect.ItemText>Todas</RadixSelect.ItemText>
                </RadixSelect.Item>
                {categories.map((category) => (
                  <RadixSelect.Item
                    key={category}
                    value={category}
                    className="cursor-pointer select-none whitespace-nowrap rounded-frame px-3 py-2 font-body text-sm text-ink outline-none data-[highlighted]:bg-primary data-[highlighted]:text-primary-ink"
                  >
                    <RadixSelect.ItemText>{category}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </div>
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-pill border-[1.5px] px-3.5 py-1.5 font-body text-[13px] font-medium ${selected ? 'border-primary bg-primary text-primary-ink' : 'border-border bg-surface text-ink/60'}`}
    >
      {label}
    </button>
  )
}
