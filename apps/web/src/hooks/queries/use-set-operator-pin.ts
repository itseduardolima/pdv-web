import { useMutation } from '@tanstack/react-query'
import { operatorSchema, type SetPinInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useSetOperatorPin(id: string) {
  return useMutation({
    mutationFn: (input: SetPinInput) =>
      apiRequest(`/operators/${id}/pin`, { method: 'PATCH', body: input, schema: operatorSchema }),
  })
}
