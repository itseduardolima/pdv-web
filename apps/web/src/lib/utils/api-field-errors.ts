import { ApiClientError } from '@/lib/api-client'

// 400 VALIDATION -> { campo: primeira mensagem }. Só a API escreve essas mensagens.
export function apiFieldErrors(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiClientError) || error.error.code !== 'VALIDATION') return null
  const details = error.error.details as { fieldErrors?: Record<string, string[]> } | undefined
  if (!details?.fieldErrors) return null
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(details.fieldErrors)) {
    if (messages?.[0]) result[field] = messages[0]
  }
  return result
}
