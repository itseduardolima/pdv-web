'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ProductCard } from '@/components/pos/ProductCard'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { SearchBar } from '@/components/ui/SearchBar'
import { useProductsPage } from './use-products-page'

export default function ProductsPage() {
  const page = useProductsPage()

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={page.isLoading ? 'Carregando...' : `${page.products.length} produtos cadastrados`}
        actions={
          <>
            <SearchBar
              value={page.search}
              onChange={(event) => page.setSearch(event.target.value)}
              placeholder="Buscar por nome ou código..."
              aria-label="Buscar produto"
              className="w-full md:w-[320px]"
            />
            {page.canManage && (
              <Button href="/products/new" size="sm" className="w-full md:w-auto">
                <PlusIcon aria-hidden />
                Novo Produto
              </Button>
            )}
          </>
        }
      />

      {page.errorMessage && <InlineAlert>{page.errorMessage}</InlineAlert>}

      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {page.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            editHref={page.canManage ? `/products/${product.id}/edit` : undefined}
          />
        ))}
      </div>

      {!page.isLoading && !page.errorMessage && page.products.length === 0 && (
        <p className="font-body text-sm text-ink/50">Nenhum produto encontrado.</p>
      )}
    </>
  )
}
