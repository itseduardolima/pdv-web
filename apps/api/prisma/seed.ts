import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { slug: 'demo', name: 'Mercadinho Demo' },
  })

  const admin = await prisma.operator.findFirst({
    where: { tenantId: tenant.id, role: 'ADMIN', deletedAt: null },
  })
  if (!admin) {
    await prisma.operator.create({
      data: {
        tenantId: tenant.id,
        name: 'Administrador',
        role: 'ADMIN',
        pinHash: await argon2.hash('1234'),
      },
    })
  }

  const products = [
    { name: 'Refrigerante Lata 350ml', category: 'Bebidas', salePriceCents: 550, costPriceCents: 320, stockQuantity: 48, minStock: 12, barcode: '7891000100103' },
    { name: 'Cerveja Lata 350ml', category: 'Bebidas', salePriceCents: 399, costPriceCents: 260, stockQuantity: 120, minStock: 24, barcode: '7891149010202' },
    { name: 'Arroz 5kg', category: 'Estiva', salePriceCents: 2890, costPriceCents: 2100, stockQuantity: 20, minStock: 5, barcode: '7896006700012' },
    { name: 'Feijão 1kg', category: 'Estiva', salePriceCents: 899, costPriceCents: 620, stockQuantity: 30, minStock: 8, barcode: '7896006700029' },
  ]
  for (const product of products) {
    await prisma.product.upsert({
      where: { tenantId_barcode: { tenantId: tenant.id, barcode: product.barcode } },
      update: {},
      create: { ...product, tenantId: tenant.id, unit: 'UN' },
    })
  }

  console.log(`Seed done for tenant "${tenant.slug}" (admin PIN: 1234)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
