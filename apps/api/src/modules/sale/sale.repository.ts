import { Inject, Injectable } from '@nestjs/common'
import type { PaymentMethod, Product } from '@prisma/client'
import { PRISMA, setTenantInTransaction, type PrismaService } from '../../prisma/prisma.client'
import { saleInclude, type SaleRow } from './sale.mapper'

export interface NewSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPriceCents: number
}

export interface NewSale {
  uuid: string
  cashSessionId: string
  operatorId: string
  paymentMethod: PaymentMethod
  totalCents: number
  amountReceivedCents: number | null
  changeCents: number | null
  soldAt: Date
  items: NewSaleItem[]
}

export class StockRaceError extends Error {
  constructor(public readonly productId: string) {
    super(`Stock changed concurrently for product ${productId}`)
  }
}

@Injectable()
export class SaleRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  findByUuid(tenantId: string, uuid: string): Promise<SaleRow | null> {
    return this.prisma.sale.findUnique({ where: { tenantId_uuid: { tenantId, uuid } }, include: saleInclude })
  }

  findProducts(tenantId: string, ids: string[]): Promise<Product[]> {
    return this.prisma.product.findMany({ where: { tenantId, id: { in: ids }, deletedAt: null } })
  }

  // Venda + itens + baixa de estoque numa transação. O update condicional
  // (stockQuantity >= quantity) garante que estoque nunca fica negativo mesmo
  // com duas vendas simultâneas — se falhar, a transação inteira é desfeita.
  createWithStockDebit(tenantId: string, sale: NewSale): Promise<SaleRow> {
    return this.prisma.$transaction(async (tx) => {
      await setTenantInTransaction(tx, tenantId)
      for (const item of sale.items) {
        const debited = await tx.product.updateMany({
          where: { tenantId, id: item.productId, deletedAt: null, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        })
        if (debited.count === 0) throw new StockRaceError(item.productId)
      }
      return tx.sale.create({
        data: {
          tenantId,
          uuid: sale.uuid,
          cashSessionId: sale.cashSessionId,
          operatorId: sale.operatorId,
          paymentMethod: sale.paymentMethod,
          totalCents: sale.totalCents,
          amountReceivedCents: sale.amountReceivedCents,
          changeCents: sale.changeCents,
          soldAt: sale.soldAt,
          items: { create: sale.items },
        },
        include: saleInclude,
      })
    })
  }

  // Tela Histórico de Vendas: vendas de UM dia (janela [from, to) resolvida
  // pelo Service no fuso da loja), mais recente primeiro. `search` filtra
  // pelo nome do produto congelado em SaleItem (o que o operador viu na
  // hora da venda, não o nome atual do Product).
  findHistory(tenantId: string, from: Date, to: Date, search?: string): Promise<SaleRow[]> {
    return this.prisma.sale.findMany({
      where: {
        tenantId,
        soldAt: { gte: from, lt: to },
        ...(search ? { items: { some: { productName: { contains: search, mode: 'insensitive' } } } } : {}),
      },
      include: saleInclude,
      orderBy: { soldAt: 'desc' },
    })
  }
}
