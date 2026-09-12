import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { productSchema, type ProductListQuery } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export const productsQueryKey = (query: ProductListQuery = {}) => ['products', query] as const

export function useProducts(query: ProductListQuery = {}) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''

  return useQuery({
    queryKey: productsQueryKey(query),
    queryFn: () => apiRequest(`/products${suffix}`, { schema: z.array(productSchema) }),
    placeholderData: (previous) => previous,
  })
}
