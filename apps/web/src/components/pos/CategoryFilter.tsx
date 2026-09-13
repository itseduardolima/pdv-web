interface CategoryFilterProps {
  categories: string[]
  // null = "Todas"
  value: string | null
  onChange: (category: string | null) => void
  className?: string
}

// Chips de categoria, roláveis na horizontal — mesmo componente em Produtos
// (filtra a lista) e Vender (filtra o grid de venda), 05-componentizacao.
// "Todas" sempre primeiro; o resto vem de DEFAULT_PRODUCT_CATEGORIES + o
// que a loja já usa (useProductCategories), então nunca aparece vazio.
export function CategoryFilter({ categories, value, onChange, className = '' }: CategoryFilterProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por categoria"
      // shrink-0: um item flex com overflow não-visible perde o tamanho
      // mínimo natural (vira 0 no eixo principal) e é espremido pelo resto
      // da coluna — sem isso a fileira de chips quase desaparece.
      className={`flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <Chip label="Todas" selected={value === null} onClick={() => onChange(null)} />
      {categories.map((category) => (
        <Chip key={category} label={category} selected={value === category} onClick={() => onChange(category)} />
      ))}
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
