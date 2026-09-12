import type { DashboardTopProduct } from '@pdv/shared'
import { ProductsIcon } from '@/components/ui/Icons'
import { formatCurrency } from '@/lib/utils/format-currency'

interface TopProductRowProps {
  position: number
  product: DashboardTopProduct
}

// Linha de "Mais vendidos hoje" (HU 7.2): posição, foto, nome, quantidade e valor.
export function TopProductRow({ position, product }: TopProductRowProps) {
  return (
    <li data-cy="top-product" className="flex items-center gap-3 py-2.5">
      <span className="w-5 shrink-0 text-center font-heading text-sm font-bold text-ink/40">{position}</span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-frame bg-canvas">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
          <img src={product.photoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <ProductsIcon aria-hidden className="h-5 w-5 text-ink/30" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
        <p className="font-body text-xs text-ink/45">{product.quantity} vendidos</p>
      </div>
      <span className="shrink-0 font-heading text-sm font-bold">{formatCurrency(product.totalCents)}</span>
    </li>
  )
}
