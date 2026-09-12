import { Injectable } from '@nestjs/common'
import type { Prisma, Product } from '@prisma/client'
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '@pdv/shared'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(tenantId: string, query: ProductListQuery): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = { tenantId, deletedAt: null }
    if (query.category) where.category = query.category
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    return this.prisma.product.findMany({ where, orderBy: { name: 'asc' } })
  }

  findById(tenantId: string, id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { tenantId, id, deletedAt: null } })
  }

  findByBarcode(tenantId: string, barcode: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { tenantId, barcode, deletedAt: null } })
  }

  async findCategories(tenantId: string): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })
    return rows.map((row) => row.category)
  }

  create(tenantId: string, data: CreateProductInput): Promise<Product> {
    return this.prisma.product.create({ data: { ...data, tenantId } })
  }

  update(tenantId: string, id: string, data: UpdateProductInput): Promise<Product> {
    // updateMany não existe com retorno; o Service já garantiu que o id é do tenant.
    return this.prisma.product.update({ where: { id, tenantId }, data })
  }

  // Soft-delete: some da lista/venda; SaleItem mantém o nome congelado. O
  // código de barras é liberado para um cadastro novo (unique por tenant).
  softDelete(tenantId: string, id: string): Promise<Product> {
    return this.prisma.product.update({ where: { id, tenantId }, data: { deletedAt: new Date(), barcode: null } })
  }
}
