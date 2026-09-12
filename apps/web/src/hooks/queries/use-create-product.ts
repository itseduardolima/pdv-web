import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productSchema, type CreateProductInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiRequest('/products', { method: 'POST', body: input, schema: productSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
