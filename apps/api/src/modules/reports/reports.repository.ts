import { Inject, Injectable } from '@nestjs/common'
import type { PaymentMethod } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

export interface ReportSaleItemRow {
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
}

export interface ReportSaleRow {
  soldAt: Date
  totalCents: number
  paymentMethod: PaymentMethod
  operatorId: string
  operatorName: string
  items: ReportSaleItemRow[]
}

export interface ReportProductRow {
  id: string
  name: string
  photoUrl: string | null
}

@Injectable()
export class ReportsRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  async findTimeZone(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } })
    return tenant?.timezone ?? null
  }

  // Vendas no intervalo [from, to), com o necessário pra todas as
  // agregações do relatório (total, forma de pagamento, produtos, operador).
  async findSalesBetween(tenantId: string, from: Date, to: Date): Promise<ReportSaleRow[]> {
    const rows = await this.prisma.sale.findMany({
      where: { tenantId, soldAt: { gte: from, lt: to } },
      select: {
        soldAt: true,
        totalCents: true,
        paymentMethod: true,
        operatorId: true,
        operator: { select: { name: true } },
        items: { select: { productId: true, productName: true, quantity: true, unitPriceCents: true } },
      },
      orderBy: { soldAt: 'asc' },
    })
    return rows.map((row) => ({
      soldAt: row.soldAt,
      totalCents: row.totalCents,
      paymentMethod: row.paymentMethod,
      operatorId: row.operatorId,
      operatorName: row.operator.name,
      items: row.items,
    }))
  }

  // Só o total vendido no período anterior (comparação, HU 12.2) — não
  // precisa do detalhe por venda.
  async sumTotalBetween(tenantId: string, from: Date, to: Date): Promise<number> {
    const result = await this.prisma.sale.aggregate({
      where: { tenantId, soldAt: { gte: from, lt: to } },
      _sum: { totalCents: true },
    })
    return result._sum.totalCents ?? 0
  }

  // Produtos ativos do tenant, pra HU 12.7 conseguir listar quem NÃO vendeu
  // nada no período (o inverso de "mais vendidos" precisa dessa base).
  findActiveProducts(tenantId: string): Promise<ReportProductRow[]> {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true, photoUrl: true },
    })
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
}
