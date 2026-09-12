import { useQuery } from '@tanstack/react-query'
import { pinTokenInfoSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'

// Quem é o dono do link e para quê ele serve; 400 INVALID_TOKEN se não vale
// mais. Sem token na URL consulta mesmo assim ("-"): a mensagem de link
// inválido é sempre a da API, nunca inventada aqui.
export function usePinToken(token: string) {
  return useQuery({
    queryKey: ['auth', 'pin-token', token],
    queryFn: () => apiRequest(`/auth/pin-token/${encodeURIComponent(token || '-')}`, { schema: pinTokenInfoSchema }),
    retry: false,
  })
}
