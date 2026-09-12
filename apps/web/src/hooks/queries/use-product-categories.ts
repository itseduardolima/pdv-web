import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

export function useProductCategories() {
  return useQuery({
    queryKey: ['products', 'categories'],
    queryFn: () => apiRequest('/products/categories', { schema: z.array(z.string()) }),
  })
}
