import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productSchema, type CreateProductRequest } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductRequest) =>
      apiRequest('/products', { method: 'POST', body: input, schema: productSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
