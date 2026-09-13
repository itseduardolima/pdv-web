import type { Product, ProductListQuery } from '@pdv/shared'
import { ApiClientError } from '@/lib/api-client'
import { matchesProductSearch } from '@/lib/utils/cart'
import type { OfflineDb } from './db'

export const PRODUCTS_CACHED_AT_KEY = 'productsCachedAt'

// Substitui o catálogo inteiro: produto excluído no servidor some daqui também.
export async function saveProductsCache(db: OfflineDb, products: Product[]): Promise<void> {
  await db.transaction('rw', db.productsCache, db.meta, async () => {
    await db.productsCache.clear()
    await db.productsCache.bulkAdd(products)
    await db.meta.put({ key: PRODUCTS_CACHED_AT_KEY, value: new Date().toISOString() })
  })
}

// null = nunca sincronizou nesta máquina (diferente de catálogo vazio).
export async function readProductsCache(db: OfflineDb): Promise<Product[] | null> {
  const cachedAt = await db.meta.get(PRODUCTS_CACHED_AT_KEY)
  if (!cachedAt) return null
  return db.productsCache.toArray()
}

// Sem rede ou API fora do ar: o caixa segue com o catálogo salvo. Erro de
// regra (401/403/404/400) não cai aqui — continua subindo pra tela.
export function isBackendUnreachable(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false
  return error.error.code === 'NETWORK_ERROR' || error.error.statusCode >= 500
}

// Mesmo filtro que a API aplica em GET /products, só que sobre o cache.
export function filterCachedProducts(products: Product[], query: ProductListQuery): Product[] {
  return products.filter(
    (product) =>
      matchesProductSearch(product, query.search ?? '') && (!query.category || product.category === query.category),
  )
}

export function categoriesFromProducts(products: Product[]): string[] {
  return [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
