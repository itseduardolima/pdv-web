import Link from 'next/link'
import type { Product } from '@pdv/shared'
import { EditIcon, ProductsIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'
import { isLowStock } from '@/lib/utils/stock-status'

interface ProductCardProps {
  product: Product
  editHref?: string
}

// Um componente: linha no celular, card no grid a partir de md.
export function ProductCard({ product, editHref }: ProductCardProps) {
  const low = isLowStock(product.stockQuantity, product.minStock)
  const stockLabel = `${product.stockQuantity} ${product.unit.toLowerCase()}`
  return (
    <article className="flex items-center gap-3 rounded-card-sm bg-surface p-3 md:flex-col md:items-stretch md:gap-3.5 md:rounded-card md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-frame bg-canvas md:h-[60px] md:w-[60px]">
          {product.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
            <img src={product.photoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <ProductsIcon aria-hidden className="text-ink/30" />
          )}
        </div>
        {editHref && (
          <Link
            href={editHref}
            aria-label={`Editar ${product.name}`}
            className="hidden h-8 w-8 items-center justify-center rounded-pill bg-canvas text-ink md:flex"
          >
            <EditIcon aria-hidden />
          </Link>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-sm font-bold tracking-tight md:whitespace-normal md:text-base">{product.name}</h3>
        <p className="font-body text-[11px] text-ink/45 md:text-xs">{product.barcode ?? product.category}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 md:mt-auto md:flex-row md:items-center md:justify-between">
        <span className="font-heading text-[15px] font-bold md:text-lg">{formatCurrency(product.salePriceCents)}</span>
        {low ? (
          <span data-cy="stock-low" className="rounded-pill bg-danger px-3 py-1 font-body text-[11px] font-semibold text-surface">
            <span className="hidden md:inline">Estoque baixo · </span>
            {stockLabel}
          </span>
        ) : (
          <span data-cy="stock-ok" className="flex items-center gap-1.5 font-body text-xs font-medium text-ink/55">
            <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-accent" />
            {stockLabel}
          </span>
        )}
      </div>

      {editHref && (
        <Link href={editHref} aria-label={`Editar ${product.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-canvas md:hidden">
          <EditIcon aria-hidden />
        </Link>
      )}
    </article>
  )
}
