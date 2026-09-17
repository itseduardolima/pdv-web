import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import { provisionTenant } from '../src/modules/tenant/tenant-provisioning'

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

// Seed idempotente: cria/atualiza um tenant e garante um Administrador ativo
// (via provisionTenant, mesma lógica usada por POST /platform/tenants).
// Parametrizado por env para onboardar um cliente novo sem tocar código
// (docs/specs/07-multitenant-whitelabel.md § Onboarding). Sem env, cria a
// loja "demo" com operadores e produtos de exemplo. Opcionalmente também
// cria/atualiza o primeiro PlatformAdmin (painel superadmin, Épico 13).
const env = process.env
const slug = env.SEED_TENANT_SLUG ?? 'demo'
const isDemo = slug === 'demo'

const prisma = new PrismaClient()

async function main() {
  const { tenant, createdAdminPin } = await provisionTenant(
    prisma,
    {
      slug,
      // Sem SEED_TENANT_NAME: em update não mexe no nome já salvo; em
      // create, provisionTenant cai no fallback 'Mercadinho Demo'.
      name: env.SEED_TENANT_NAME,
      domain: env.SEED_TENANT_DOMAIN ?? null,
      logoUrl: env.SEED_TENANT_LOGO_URL ?? null,
      primaryColor: env.SEED_PRIMARY_COLOR ?? undefined,
      primaryInkColor: env.SEED_PRIMARY_INK_COLOR ?? null,
      accentColor: env.SEED_ACCENT_COLOR ?? undefined,
    },
    {
      name: env.SEED_ADMIN_NAME ?? 'Administrador',
      // E-mail é como o admin recupera o PIN sem depender de ninguém.
      email: env.SEED_ADMIN_EMAIL ?? (isDemo ? 'admin@mercadinho-demo.com.br' : null),
      pin: env.SEED_ADMIN_PIN ?? '1234',
    },
  )

  if (isDemo) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenant.id}, true)`
      await seedDemoData(tx, tenant.id)
    })
  }

  console.log(
    `Seed done for tenant "${tenant.slug}" (${tenant.name})${createdAdminPin ? ` — admin PIN: ${createdAdminPin}` : ''}`,
  )

  if (env.SEED_PLATFORM_ADMIN_EMAIL && env.SEED_PLATFORM_ADMIN_PASSWORD) {
    await seedPlatformAdmin(
      env.SEED_PLATFORM_ADMIN_EMAIL,
      env.SEED_PLATFORM_ADMIN_PASSWORD,
      env.SEED_PLATFORM_ADMIN_NAME,
    )
  }
}

// Bootstrap do primeiro (ou de mais um) superadmin da plataforma — conta
// fora de qualquer tenant, ver src/modules/platform. Idempotente por
// e-mail; a senha só é re-hasheada quando fornecida de novo.
async function seedPlatformAdmin(email: string, password: string, name?: string) {
  const passwordHash = await argon2.hash(password)
  await prisma.platformAdmin.upsert({
    where: { email },
    update: { passwordHash, name: name ?? undefined },
    create: { email, passwordHash, name: name ?? 'Superadmin' },
  })
  console.log(`Seed done for platform admin "${email}"`)
}

// Dados de exemplo só para a loja demo (desenvolvimento e E2E).
async function seedDemoData(tx: Tx, tenantId: string) {
  const extraOperators = [
    { name: 'Rafael', role: 'OPERATOR' as const, active: true, pin: '2222' },
    { name: 'Luana', role: 'OPERATOR' as const, active: false, pin: '3333' },
  ]
  for (const extra of extraOperators) {
    const exists = await tx.operator.findFirst({ where: { tenantId, name: extra.name } })
    if (!exists) {
      await tx.operator.create({
        data: {
          tenantId,
          name: extra.name,
          role: extra.role,
          active: extra.active,
          pinHash: await argon2.hash(extra.pin),
        },
      })
    }
  }

  const products = [
    {
      name: 'Refrigerante Lata 350ml',
      category: 'Bebidas',
      salePriceCents: 550,
      costPriceCents: 320,
      stockQuantity: 48,
      minStock: 12,
      barcode: '7891000100103',
    },
    {
      name: 'Cerveja Lata 350ml',
      category: 'Bebidas alcoólicas',
      salePriceCents: 399,
      costPriceCents: 260,
      stockQuantity: 120,
      minStock: 24,
      barcode: '7891149010202',
    },
    {
      name: 'Arroz 5kg',
      category: 'Estiva',
      salePriceCents: 2890,
      costPriceCents: 2100,
      stockQuantity: 20,
      minStock: 5,
      barcode: '7896006700012',
    },
    {
      name: 'Feijão 1kg',
      category: 'Estiva',
      salePriceCents: 899,
      costPriceCents: 620,
      stockQuantity: 30,
      minStock: 8,
      barcode: '7896006700029',
    },
  ]
  for (const product of products) {
    await tx.product.upsert({
      where: { tenantId_barcode: { tenantId, barcode: product.barcode } },
      update: {},
      create: { ...product, tenantId, unit: 'UN' },
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
