import { zodToOpenAPI } from 'nestjs-zod'
import type { z } from 'zod'
import { apiErrorSchema } from '@pdv/shared'

// Schemas OpenAPI gerados dos mesmos Zod de packages/shared — o contrato
// documentado no Swagger é exatamente o que a API valida e devolve.
export const openApi = (schema: z.ZodTypeAny) => zodToOpenAPI(schema)

export const apiErrorOpenApi = openApi(apiErrorSchema)
