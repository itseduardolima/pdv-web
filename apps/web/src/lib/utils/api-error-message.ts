import type { ApiError } from '@pdv/shared'
import { ApiClientError } from '@/lib/api-client'

// Extrai o texto a exibir de um erro da API: a primeira mensagem de campo
// (400 VALIDATION) ou a mensagem geral. Nunca inventa texto no cliente.
export function apiErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiClientError)) return null
  const details = error.error.details as ApiError['details'] & { fieldErrors?: Record<string, string[]> }
  const fieldMessage = details?.fieldErrors ? Object.values(details.fieldErrors).flat()[0] : undefined
  return fieldMessage ?? error.error.message
}
