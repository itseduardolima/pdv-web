import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productSchema, type UpdateProductRequest } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProductRequest) =>
      apiRequest(`/products/${id}`, { method: 'PATCH', body: input, schema: productSchema }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
