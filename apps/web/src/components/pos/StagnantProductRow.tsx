import type { ReportStagnantProduct } from '@pdv/shared'
import { ProductsIcon } from '@/components/ui/Icons'

interface StagnantProductRowProps {
  product: ReportStagnantProduct
}

// Linha de "Produtos Parados" (HU 12.7) — o oposto de "mais vendidos":
// pouca ou nenhuma venda no período, candidato a promoção/desova.
export function StagnantProductRow({ product }: StagnantProductRowProps) {
  return (
    <li data-cy="stagnant-product-row" className="flex items-center gap-3 py-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-frame bg-canvas">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
          <img src={product.photoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <ProductsIcon aria-hidden className="h-5 w-5 text-ink/30" />
        )}
      </div>
      <p className="min-w-0 flex-1 truncate font-body text-sm font-semibold text-ink">{product.name}</p>
      <span className="shrink-0 font-body text-xs font-semibold text-danger">
        {product.quantitySold === 0 ? 'Nenhuma venda' : `${product.quantitySold} un.`}
      </span>
    </li>
  )
}
