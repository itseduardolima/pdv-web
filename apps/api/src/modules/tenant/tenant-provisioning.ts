import type { PrismaClient, Tenant } from '@prisma/client'
import argon2 from 'argon2'

export interface ProvisionTenantInput {
  slug: string
  // Opcional: ausente/undefined em `update` NÃO apaga o nome já salvo (Prisma
  // ignora o campo) — só em `create` cai no fallback abaixo, já que Tenant.name
  // não tem @default no schema.
  name?: string
  domain?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  primaryInkColor?: string | null
  accentColor?: string | null
}

export interface ProvisionAdminInput {
  name: string
  email?: string | null
  // Opcional: sem PIN, o operador nasce com pinHash null (mesmo
  // comportamento de OperatorService.create sem PIN) — quem chama decide
  // se manda o link de primeiro acesso (PinTokenService.sendPinLink),
  // já que essa função não tem acesso a MailService.
  pin?: string
}

export interface CreatedAdmin {
  id: string
  name: string
  email: string | null
  pinHash: string | null
}

export interface ProvisionTenantResult {
  tenant: Tenant
  // PIN em texto puro só quando um admin novo foi de fato criado agora E um
  // PIN foi passado — pra poder ser mostrado/logado uma única vez (nunca
  // fica guardado).
  createdAdminPin: string | null
  // O operador recém-criado, ou null quando já existia um admin ativo
  // (upsert idempotente). Quem chama usa isso pra decidir se manda o link
  // de primeiro acesso.
  createdAdmin: CreatedAdmin | null
}

// Upsert idempotente por slug + garante 1 Administrador ativo. Miolo
// reaproveitado tanto por `prisma/seed.ts` (bootstrap por script/CLI) quanto
// por `PlatformTenantService` (POST /platform/tenants) — não duplica a
// regra nos dois lugares. Função pura (recebe o PrismaClient em vez de usar
// injeção do Nest) porque o `seed.ts` roda fora de qualquer contexto de
// request/DI.
//
// Gerencia sua própria transação e seta `app.tenant_id` manualmente: o
// `Operator` criado aqui tem Row-Level Security (`FORCE ROW LEVEL
// SECURITY`), então o insert falha silenciosamente (0 linhas) sem isso —
// tenant novo ou não, não há contexto de request/AsyncLocalStorage aqui.
export async function provisionTenant(
  prisma: PrismaClient,
  tenantInput: ProvisionTenantInput,
  adminInput: ProvisionAdminInput,
): Promise<ProvisionTenantResult> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantInput.slug },
    update: {
      name: tenantInput.name ?? undefined,
      domain: tenantInput.domain ?? undefined,
      logoUrl: tenantInput.logoUrl ?? undefined,
      primaryColor: tenantInput.primaryColor ?? undefined,
      primaryInkColor: tenantInput.primaryInkColor ?? undefined,
      accentColor: tenantInput.accentColor ?? undefined,
    },
    create: {
      slug: tenantInput.slug,
      // Tenant.name não tem @default no schema.prisma — precisa de um
      // valor concreto na criação, mesmo sem nome informado.
      name: tenantInput.name ?? 'Mercadinho Demo',
      domain: tenantInput.domain ?? null,
      logoUrl: tenantInput.logoUrl ?? null,
      primaryColor: tenantInput.primaryColor ?? undefined,
      primaryInkColor: tenantInput.primaryInkColor ?? null,
      accentColor: tenantInput.accentColor ?? undefined,
    },
  })

  const { createdAdminPin, createdAdmin } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`

    // Nunca deixa um tenant sem Administrador ativo; nunca troca PIN de um admin existente.
    const admin = await tx.operator.findFirst({
      where: { tenantId: tenant.id, role: 'ADMIN', active: true, deletedAt: null },
    })
    if (admin) return { createdAdminPin: null, createdAdmin: null }

    const pinHash = adminInput.pin ? await argon2.hash(adminInput.pin) : null
    const created = await tx.operator.create({
      data: {
        tenantId: tenant.id,
        name: adminInput.name,
        role: 'ADMIN',
        email: adminInput.email ?? null,
        pinHash,
      },
    })
    return {
      createdAdminPin: adminInput.pin ?? null,
      createdAdmin: { id: created.id, name: created.name, email: created.email, pinHash: created.pinHash },
    }
  })

  return { tenant, createdAdminPin, createdAdmin }
}
