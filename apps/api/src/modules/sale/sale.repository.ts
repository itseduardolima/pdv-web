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

export interface NewSalePayment {
  method: PaymentMethod
  amountCents: number
}

export interface NewSale {
  uuid: string
  cashSessionId: string
  operatorId: string
  paymentMethod: PaymentMethod
  payments: NewSalePayment[]
  totalCents: number
  amountReceivedCents: number | null
  changeCents: number | null
  soldAt: Date
  items: NewSaleItem[]
}

// A venda já estava anulada ou o caixa fechou entre a checagem e a gravação.
export class SaleNotVoidableError extends Error {}

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

  findById(tenantId: string, id: string): Promise<SaleRow | null> {
    return this.prisma.sale.findFirst({ where: { tenantId, id }, include: saleInclude })
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
          payments: { create: sale.payments.map((payment) => ({ ...payment, tenantId })) },
        },
        include: saleInclude,
      })
    })
  }

  // Anulação: marca a venda e devolve o estoque numa transação. Com a sessão
  // travada, o updateMany condicional (não anulada, caixa aberto) vê o estado
  // final de qualquer anulação ou fechamento concorrente.
  voidWithStockReturn(tenantId: string, saleId: string, voidedById: string, reason: string): Promise<SaleRow> {
    return this.prisma.$transaction(async (tx) => {
      await setTenantInTransaction(tx, tenantId)
      // Trava a sessão do caixa: serializa com o fechamento (que trava a
      // mesma linha), então não anula uma venda já contada nos totais congelados.
      const sale = await tx.sale.findFirst({ where: { tenantId, id: saleId }, select: { cashSessionId: true } })
      if (!sale) throw new SaleNotVoidableError()
      await tx.$queryRaw`SELECT id FROM "CashSession" WHERE id = ${sale.cashSessionId} FOR UPDATE`
      const marked = await tx.sale.updateMany({
        where: { tenantId, id: saleId, voidedAt: null, cashSession: { closedAt: null } },
        data: { voidedAt: new Date(), voidedById, voidReason: reason },
      })
      if (marked.count === 0) throw new SaleNotVoidableError()
      const items = await tx.saleItem.findMany({ where: { saleId, sale: { tenantId } } })
      for (const item of items) {
        await tx.product.updateMany({
          where: { tenantId, id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      }
      return tx.sale.findFirstOrThrow({ where: { tenantId, id: saleId }, include: saleInclude })
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
