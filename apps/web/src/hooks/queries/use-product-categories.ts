import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useTenant } from '@/hooks/use-tenant'
import { apiRequest } from '@/lib/api-client'
import { getOfflineDb } from '@/lib/offline/db'
import { categoriesFromProducts, isBackendUnreachable, readProductsCache } from '@/lib/offline/products-cache'

export function useProductCategories() {
  const tenant = useTenant()
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: async (): Promise<string[]> => {
      try {
        return await apiRequest('/products/categories', { schema: z.array(z.string()) })
      } catch (error) {
        // Sem rede: as categorias saem do catálogo salvo (HU 8.1).
        if (!isBackendUnreachable(error)) throw error
        const cached = await readProductsCache(getOfflineDb(tenant.id))
        if (!cached) throw error
        return categoriesFromProducts(cached)
      }
    },
    networkMode: 'always',
  })
}
