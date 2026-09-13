import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { productSchema, type Product, type ProductListQuery } from '@pdv/shared'
import { useTenant } from '@/hooks/use-tenant'
import { apiRequest } from '@/lib/api-client'
import { getOfflineDb } from '@/lib/offline/db'
import {
  filterCachedProducts,
  isBackendUnreachable,
  readProductsCache,
  saveProductsCache,
} from '@/lib/offline/products-cache'

export const productsQueryKey = (query: ProductListQuery = {}) => ['products', query] as const

// HU 8.1 (stale-while-revalidate): a lista completa vai pro IndexedDB a cada
// resposta boa; sem rede, a busca/categoria roda sobre esse cache. Vender
// não depende de rede — mas nunca sem ter sincronizado ao menos uma vez.
export function useProducts(query: ProductListQuery = {}) {
  const tenant = useTenant()
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  const isFullList = params.size === 0

  return useQuery({
    queryKey: productsQueryKey(query),
    queryFn: async (): Promise<Product[]> => {
      const db = getOfflineDb(tenant.id)
      try {
        const products = await apiRequest(`/products${suffix}`, { schema: z.array(productSchema) })
        if (isFullList) await saveProductsCache(db, products)
        return products
      } catch (error) {
        if (!isBackendUnreachable(error)) throw error
        const cached = await readProductsCache(db)
        if (!cached) throw error
        return filterCachedProducts(cached, query)
      }
    },
    // 'online' (padrão) nem chama o queryFn sem navigator.onLine — e aí o
    // fallback pro cache nunca rodaria.
    networkMode: 'always',
    placeholderData: (previous) => previous,
  })
}
