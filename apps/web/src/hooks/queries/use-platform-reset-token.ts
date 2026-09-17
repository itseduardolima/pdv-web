import { useQuery } from '@tanstack/react-query'
import { platformResetTokenInfoSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// Quem é o dono do link; 400 INVALID_TOKEN se não vale mais. Sem token na
// URL consulta mesmo assim ("-"): a mensagem de link inválido é sempre a
// da API, nunca inventada aqui.
export function usePlatformResetToken(token: string) {
  return useQuery({
    queryKey: ['platform', 'reset-token', token],
    queryFn: () =>
      apiRequest(`/platform/auth/reset-token/${encodeURIComponent(token || '-')}`, {
        schema: platformResetTokenInfoSchema,
      }),
    retry: false,
  })
}
