import { Inject, Injectable } from '@nestjs/common'
import type { PaymentMethod } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

export interface DashboardSaleItemRow {
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
}

export interface DashboardSaleRow {
  soldAt: Date
  totalCents: number
  paymentMethod: PaymentMethod
  items: DashboardSaleItemRow[]
}

@Injectable()
export class DashboardRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  async findTimeZone(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } })
    return tenant?.timezone ?? null
  }

  // Foto atual dos produtos mais vendidos (inclui excluídos: a venda existiu).
  async findProductPhotos(tenantId: string, ids: string[]): Promise<Map<string, string | null>> {
    if (ids.length === 0) return new Map()
    const rows = await this.prisma.product.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, photoUrl: true },
    })
    return new Map(rows.map((row) => [row.id, row.photoUrl]))
  }

  // Vendas no intervalo [from, to), só os campos que o resumo agrega.
  findSalesBetween(tenantId: string, from: Date, to: Date): Promise<DashboardSaleRow[]> {
    return this.prisma.sale.findMany({
      where: { tenantId, soldAt: { gte: from, lt: to } },
      select: {
        soldAt: true,
        totalCents: true,
        paymentMethod: true,
        items: { select: { productId: true, productName: true, quantity: true, unitPriceCents: true } },
      },
      orderBy: { soldAt: 'asc' },
    })
  }
}
