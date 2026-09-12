import { useMutation } from '@tanstack/react-query'
import { currentSessionSchema, type LoginInput } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest('/auth/login', { method: 'POST', body: input, schema: currentSessionSchema }),
  })
}
