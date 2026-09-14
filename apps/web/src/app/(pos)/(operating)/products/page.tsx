'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { CategoryFilter } from '@/components/pos/CategoryFilter'
import { ProductCard } from '@/components/pos/ProductCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlusIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Loader } from '@/components/ui/Loader'
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

      {page.categories.length > 0 && (
        <CategoryFilter categories={page.categories} value={page.category} onChange={page.setCategory} />
      )}

      {page.errorMessage && <InlineAlert>{page.errorMessage}</InlineAlert>}

      {page.isLoading && <Loader className="flex-1" />}

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
        <EmptyState
          title={page.hasFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          description={
            page.hasFilter
              ? 'Tente outro nome, categoria ou código de barras.'
              : 'Cadastre o primeiro produto para começar a vender.'
          }
          action={
            !page.hasFilter && page.canManage ? (
              <Button href="/products/new" size="sm">
                <PlusIcon aria-hidden />
                Novo Produto
              </Button>
            ) : undefined
          }
        />
      )}
    </>
  )
}
