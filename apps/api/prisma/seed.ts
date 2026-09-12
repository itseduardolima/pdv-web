import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

// Seed idempotente: cria/atualiza um tenant e garante um Administrador ativo.
// Parametrizado por env para onboardar um cliente novo sem tocar código
// (docs/specs/07-multitenant-whitelabel.md § Onboarding). Sem env, cria a
// loja "demo" com operadores e produtos de exemplo.
const env = process.env
const slug = env.SEED_TENANT_SLUG ?? 'demo'
const isDemo = slug === 'demo'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {
      name: env.SEED_TENANT_NAME ?? undefined,
      domain: env.SEED_TENANT_DOMAIN ?? undefined,
      logoUrl: env.SEED_TENANT_LOGO_URL ?? undefined,
      primaryColor: env.SEED_PRIMARY_COLOR ?? undefined,
      primaryInkColor: env.SEED_PRIMARY_INK_COLOR ?? undefined,
      accentColor: env.SEED_ACCENT_COLOR ?? undefined,
    },
    create: {
      slug,
      name: env.SEED_TENANT_NAME ?? 'Mercadinho Demo',
      domain: env.SEED_TENANT_DOMAIN ?? null,
      logoUrl: env.SEED_TENANT_LOGO_URL ?? null,
      primaryColor: env.SEED_PRIMARY_COLOR ?? '#e6e51e',
      primaryInkColor: env.SEED_PRIMARY_INK_COLOR ?? null,
      accentColor: env.SEED_ACCENT_COLOR ?? '#466cf3',
    },
  })

  // Nunca deixa um tenant sem Administrador ativo; nunca troca PIN de um admin existente.
  const admin = await prisma.operator.findFirst({
    where: { tenantId: tenant.id, role: 'ADMIN', active: true, deletedAt: null },
  })
  const adminPin = env.SEED_ADMIN_PIN ?? '1234'
  if (!admin) {
    await prisma.operator.create({
      data: {
        tenantId: tenant.id,
        name: env.SEED_ADMIN_NAME ?? 'Administrador',
        role: 'ADMIN',
        pinHash: await argon2.hash(adminPin),
      },
    })
  }

  if (isDemo) await seedDemoData(tenant.id)

  console.log(
    `Seed done for tenant "${tenant.slug}" (${tenant.name})${admin ? '' : ` — admin PIN: ${adminPin}`}`,
  )
}

// Dados de exemplo só para a loja demo (desenvolvimento e E2E).
async function seedDemoData(tenantId: string) {
  const extraOperators = [
    { name: 'Rafael', role: 'OPERATOR' as const, active: true, pin: '2222' },
    { name: 'Luana', role: 'OPERATOR' as const, active: false, pin: '3333' },
  ]
  for (const extra of extraOperators) {
    const exists = await prisma.operator.findFirst({ where: { tenantId, name: extra.name } })
    if (!exists) {
      await prisma.operator.create({
        data: { tenantId, name: extra.name, role: extra.role, active: extra.active, pinHash: await argon2.hash(extra.pin) },
      })
    }
  }

  const products = [
    { name: 'Refrigerante Lata 350ml', category: 'Bebidas', salePriceCents: 550, costPriceCents: 320, stockQuantity: 48, minStock: 12, barcode: '7891000100103' },
    { name: 'Cerveja Lata 350ml', category: 'Bebidas', salePriceCents: 399, costPriceCents: 260, stockQuantity: 120, minStock: 24, barcode: '7891149010202' },
    { name: 'Arroz 5kg', category: 'Estiva', salePriceCents: 2890, costPriceCents: 2100, stockQuantity: 20, minStock: 5, barcode: '7896006700012' },
    { name: 'Feijão 1kg', category: 'Estiva', salePriceCents: 899, costPriceCents: 620, stockQuantity: 30, minStock: 8, barcode: '7896006700029' },
  ]
  for (const product of products) {
    await prisma.product.upsert({
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
