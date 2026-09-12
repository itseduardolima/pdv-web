import { ApiClientError } from '@/lib/api-client'
import { apiFieldErrors } from './api-field-errors'

// Texto a exibir de um erro da API: a primeira mensagem de campo (400
// VALIDATION) ou a mensagem geral. Nunca inventa texto no cliente.
export function apiErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiClientError)) return null
  const fieldMessage = Object.values(apiFieldErrors(error) ?? {})[0]
  return fieldMessage ?? error.error.message
}

// Mensagem geral de um erro que NÃO é de campo (regra de negócio, rede) —
// erros de campo já aparecem embaixo de cada input.
export function apiGeneralErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiClientError)) return null
  return apiFieldErrors(error) ? null : error.error.message
}
