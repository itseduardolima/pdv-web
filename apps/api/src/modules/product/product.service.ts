import { Injectable } from '@nestjs/common'
import type { Product as ProductRow } from '@prisma/client'
import type { CreateProductInput, Product, ProductListQuery, UpdateProductInput } from '@pdv/shared'
import { ConflictError, NotFoundError } from '../../common/errors/domain.error'
import { ProductRepository } from './product.repository'

const productNotFound = () => new NotFoundError('PRODUCT_NOT_FOUND', 'Produto não encontrado.')
const barcodeInUse = () =>
  new ConflictError('BARCODE_IN_USE', 'Já existe um produto com este código de barras.')

@Injectable()
export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  async list(tenantId: string, query: ProductListQuery): Promise<Product[]> {
    const rows = await this.products.findMany(tenantId, query)
    return rows.map(toPublic)
  }

  async get(tenantId: string, id: string): Promise<Product> {
    const row = await this.products.findById(tenantId, id)
    if (!row) throw productNotFound()
    return toPublic(row)
  }

  listCategories(tenantId: string): Promise<string[]> {
    return this.products.findCategories(tenantId)
  }

  async create(tenantId: string, input: CreateProductInput): Promise<Product> {
    const barcode = normalizeBarcode(input.barcode)
    await this.assertBarcodeAvailable(tenantId, barcode)
    return toPublic(await this.products.create(tenantId, { ...input, barcode }))
  }

  async update(tenantId: string, id: string, input: UpdateProductInput): Promise<Product> {
    const current = await this.products.findById(tenantId, id)
    if (!current) throw productNotFound()

    const data: UpdateProductInput = { ...input }
    if ('barcode' in input) {
      data.barcode = normalizeBarcode(input.barcode)
      if (data.barcode !== current.barcode) await this.assertBarcodeAvailable(tenantId, data.barcode, id)
    }
    return toPublic(await this.products.update(tenantId, id, data))
  }

  // Código de barras é único dentro do tenant (03-regras-negocio § Produtos).
  private async assertBarcodeAvailable(tenantId: string, barcode: string | null, exceptId?: string) {
    if (!barcode) return
    const existing = await this.products.findByBarcode(tenantId, barcode)
    if (existing && existing.id !== exceptId) throw barcodeInUse()
  }
}

// "" e undefined viram null: sem código de barras.
function normalizeBarcode(barcode: string | null | undefined): string | null {
  const value = barcode?.trim()
  return value ? value : null
}

// Nunca devolver a linha do Prisma inteira (08-seguranca § 9).
function toPublic(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    barcode: row.barcode,
    salePriceCents: row.salePriceCents,
    costPriceCents: row.costPriceCents,
    stockQuantity: row.stockQuantity,
    minStock: row.minStock,
    photoUrl: row.photoUrl,
  }
}
