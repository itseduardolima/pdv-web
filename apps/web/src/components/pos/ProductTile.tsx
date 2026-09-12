import type { Product } from '@pdv/shared'
import { ProductsIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'
import { isLowStock } from '@/lib/utils/stock-status'

interface ProductTileProps {
  product: Product
  onAdd: (product: Product) => void
}

// Card compacto do grid de venda: toque adiciona 1 unidade ao carrinho.
export function ProductTile({ product, onAdd }: ProductTileProps) {
  const low = isLowStock(product.stockQuantity, product.minStock)
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      aria-label={`Adicionar ${product.name}`}
      className="relative flex min-h-[100px] flex-col gap-1.5 rounded-input bg-surface p-2.5 text-left md:min-h-[120px] md:gap-2 md:rounded-card-sm md:p-3.5"
    >
      {low && (
        <span
          data-cy="stock-tag"
          className="absolute right-2 top-2 rounded-pill bg-danger px-2 py-0.5 font-body text-[10px] font-semibold text-surface"
        >
          {product.stockQuantity} {product.unit.toLowerCase()}
        </span>
      )}
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-frame bg-canvas md:h-[42px] md:w-[42px]">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
          <img src={product.photoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <ProductsIcon aria-hidden className="text-ink/30" width="16" height="16" />
        )}
      </span>
      <span className="line-clamp-2 font-body text-[11px] font-medium leading-tight md:text-[13px]">
        {product.name}
      </span>
      <span className="mt-auto font-heading text-sm font-bold md:text-[17px]">
        {formatCurrency(product.salePriceCents)}
      </span>
    </button>
  )
}
