import { z } from 'zod'
import { emailSchema, hexColorSchema, idSchema, pinSchema } from './common'

// Limites de campo: o schema valida com eles, o formulário só os mostra
// (mesma convenção de OPERATOR_LIMITS/TENANT_LIMITS).
export const PLATFORM_TENANT_LIMITS = {
  name: { min: 1, max: 100 },
  slug: { min: 2, max: 40 },
} as const

export const PLATFORM_TENANT_PAGE_LIMITS = {
  pageSize: { default: 6, max: 50 },
} as const

// Slugs que nunca podem virar host de loja — colidiriam com o próprio
// painel ou com infra reservada (01-arquitetura.md § Multi-tenant).
export const RESERVED_TENANT_SLUGS = ['admin', 'api', 'www', 'platform'] as const

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SLUG_PATTERN_MESSAGE = 'Use só letras minúsculas, números e hífen (ex.: mercadinho-da-maria)'

// Conta do dono do sistema (revendedor) — nunca expõe passwordHash, mesma
// regra de 08-seguranca.md § 9. Não é um Operator: fica fora do par
// Operador/Administrador de 03-regras-negocio.md § Papéis, de propósito.
export const platformAdminSchema = z.object({
  id: idSchema,
  email: emailSchema,
  name: z.string(),
  createdAt: z.string().datetime(),
})
export type PlatformAdmin = z.infer<typeof platformAdminSchema>

export const platformLoginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Informe a senha' }).min(1, 'Informe a senha'),
})
export type PlatformLoginInput = z.infer<typeof platformLoginSchema>

// `adminEmail` é opcional (só serve pra recuperação de PIN depois, mesmo
// campo de Operator) — mas `adminPin` é sempre obrigatório aqui: ao
// contrário da criação normal de operador (createOperatorSchema, que aceita
// só e-mail e manda link de primeiro acesso), provisionar uma loja nova
// pelo painel sempre define um PIN de partida na hora, sem depender de
// e-mail configurado (mesmo comportamento que `seed.ts` sempre teve).
export const createPlatformTenantSchema = z.object({
  name: z
    .string({ required_error: 'Informe o nome da loja' })
    .trim()
    .min(PLATFORM_TENANT_LIMITS.name.min, 'Informe o nome da loja')
    .max(PLATFORM_TENANT_LIMITS.name.max, `O nome pode ter no máximo ${PLATFORM_TENANT_LIMITS.name.max} caracteres`),
  slug: z
    .string({ required_error: 'Informe o identificador da loja' })
    .trim()
    .toLowerCase()
    .min(
      PLATFORM_TENANT_LIMITS.slug.min,
      `O identificador precisa ter pelo menos ${PLATFORM_TENANT_LIMITS.slug.min} caracteres`,
    )
    .max(
      PLATFORM_TENANT_LIMITS.slug.max,
      `O identificador pode ter no máximo ${PLATFORM_TENANT_LIMITS.slug.max} caracteres`,
    )
    .regex(SLUG_PATTERN, SLUG_PATTERN_MESSAGE),
  primaryColor: hexColorSchema.optional(),
  adminName: z
    .string({ required_error: 'Informe o nome do administrador' })
    .trim()
    .min(2, 'Informe o nome do administrador'),
  adminEmail: z.preprocess((value) => (value === '' ? undefined : value), emailSchema.optional()),
  adminPin: pinSchema,
})
export type CreatePlatformTenantInput = z.infer<typeof createPlatformTenantSchema>

// Linha da listagem — só cadastro, nunca dado operacional (venda/produto)
// de nenhuma loja.
export const platformTenantSchema = z.object({
  id: idSchema,
  slug: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  createdAt: z.string().datetime(),
  activeOperatorCount: z.number().int().nonnegative(),
  // HU 13.7: false = loja suspensa (acesso bloqueado, dado preservado).
  active: z.boolean(),
})
export type PlatformTenant = z.infer<typeof platformTenantSchema>

export const setPlatformTenantActiveSchema = z.object({ active: z.boolean() })
export type SetPlatformTenantActiveInput = z.infer<typeof setPlatformTenantActiveSchema>

// Query da listagem: page/pageSize chegam como string na querystring, por
// isso z.coerce (mesmo padrão de paginação usado em outros list query DTOs).
export const platformTenantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PLATFORM_TENANT_PAGE_LIMITS.pageSize.max)
    .default(PLATFORM_TENANT_PAGE_LIMITS.pageSize.default),
  q: z.string().trim().max(120).optional(),
})
export type PlatformTenantListQuery = z.infer<typeof platformTenantListQuerySchema>

// Envelope paginado — totalOperators/newLast30Days são calculados sobre TODO
// o conjunto filtrado (não só a página atual), pros KPIs do painel baterem
// mesmo com paginação.
export const platformTenantPageSchema = z.object({
  items: z.array(platformTenantSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalOperators: z.number().int().nonnegative(),
  newLast30Days: z.number().int().nonnegative(),
})
export type PlatformTenantPage = z.infer<typeof platformTenantPageSchema>
