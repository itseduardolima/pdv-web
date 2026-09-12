import type { z } from 'zod'
import { apiErrorSchema, type ApiError } from '@pdv/shared'
import { env } from './env'

export const TENANT_HOST_HEADER = 'x-tenant-host'

export class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
  }
}

interface RequestOptions<TSchema extends z.ZodTypeAny> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  schema: TSchema
  headers?: Record<string, string>
}

// A API resolve o tenant pelo host de quem acessa o app, não pelo host da
// própria API — por isso o browser sempre envia o host atual. No servidor
// (RSC) o chamador passa o header a partir de headers() do Next.
function tenantHostHeader(): Record<string, string> {
  return typeof window === 'undefined' ? {} : { [TENANT_HOST_HEADER]: window.location.host }
}

export async function apiRequest<TSchema extends z.ZodTypeAny>(
  path: string,
  { method = 'GET', body, schema, headers }: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const baseUrl = typeof window === 'undefined' ? env.apiInternalUrl : env.apiUrl

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...tenantHostHeader(), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiClientError({ statusCode: 0, code: 'NETWORK_ERROR', message: 'Falha ao comunicar com o servidor.' })
  }

  const payload: unknown = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload)
    throw new ApiClientError(
      parsed.success
        ? parsed.data
        : { statusCode: response.status, code: 'HTTP_ERROR', message: 'Falha ao comunicar com o servidor.' },
    )
  }

  return schema.parse(payload)
}
