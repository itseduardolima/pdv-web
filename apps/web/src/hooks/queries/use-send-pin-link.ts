import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { apiRequest } from '@/lib/api-client'

// Admin reenvia o link (primeiro acesso ou redefinição) para quem tem e-mail.
export function useSendPinLink(id: string) {
  return useMutation({
    mutationFn: () => apiRequest(`/operators/${id}/send-pin-link`, { method: 'POST', schema: z.null() }),
  })
}
