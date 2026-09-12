import { useQuery } from '@tanstack/react-query'
import { productSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => apiRequest(`/products/${id}`, { schema: productSchema }),
  })
}
