import { Injectable } from '@nestjs/common'
import {
  DASHBOARD_TOP_PRODUCTS,
  DASHBOARD_WEEK_DAYS,
  type DashboardDay,
  type DashboardSummary,
  type DashboardTopProduct,
  type PaymentMethod,
} from '@pdv/shared'
import { addDaysToDayKey, dayKeyInTimeZone, isValidTimeZone, startOfDayInTimeZone } from '../../common/utils/time-zone'
import { DashboardRepository, type DashboardSaleRow } from './dashboard.repository'

const FALLBACK_TIME_ZONE = 'UTC'

@Injectable()
export class DashboardService {
  constructor(private readonly dashboard: DashboardRepository) {}

  // "Hoje" e "semana" são no fuso da loja (03-regras-negocio § Dashboard):
  // uma venda às 23h em São Paulo é de hoje, mesmo já sendo amanhã em UTC.
  async summary(tenantId: string, now: Date = new Date()): Promise<DashboardSummary> {
    const timeZone = await this.resolveTimeZone(tenantId)
    const today = dayKeyInTimeZone(now, timeZone)
    const firstDay = addDaysToDayKey(today, -(DASHBOARD_WEEK_DAYS - 1))
    const from = startOfDayInTimeZone(firstDay, timeZone)
    const to = startOfDayInTimeZone(addDaysToDayKey(today, 1), timeZone)

    const sales = await this.dashboard.findSalesBetween(tenantId, from, to)
    const byDay = new Map<string, DashboardSaleRow[]>()
    for (const sale of sales) {
      const key = dayKeyInTimeZone(sale.soldAt, timeZone)
      byDay.set(key, [...(byDay.get(key) ?? []), sale])
    }

    const week: DashboardDay[] = []
    for (let offset = -(DASHBOARD_WEEK_DAYS - 1); offset <= 0; offset += 1) {
      const date = addDaysToDayKey(today, offset)
      week.push(dayTotals(date, byDay.get(date) ?? []))
    }

    const todaySales = byDay.get(today) ?? []
    const top = topProducts(todaySales)
    const photos = await this.dashboard.findProductPhotos(
      tenantId,
      top.map((product) => product.productId),
    )
    return {
      today: { ...dayTotals(today, todaySales), byPaymentMethod: totalsByPaymentMethod(todaySales) },
      topProductsToday: top.map((product) => ({ ...product, photoUrl: photos.get(product.productId) ?? null })),
      week,
    }
  }

  private async resolveTimeZone(tenantId: string): Promise<string> {
    const stored = await this.dashboard.findTimeZone(tenantId)
    return stored && isValidTimeZone(stored) ? stored : FALLBACK_TIME_ZONE
  }
}

function dayTotals(date: string, sales: DashboardSaleRow[]): DashboardDay {
  return {
    date,
    totalCents: sales.reduce((sum, sale) => sum + sale.totalCents, 0),
    salesCount: sales.length,
  }
}

function totalsByPaymentMethod(sales: DashboardSaleRow[]): Record<PaymentMethod, number> {
  const totals: Record<PaymentMethod, number> = { CASH: 0, CARD: 0, PIX: 0 }
  for (const sale of sales) totals[sale.paymentMethod] += sale.totalCents
  return totals
}

// Mais vendidos por quantidade; empate resolve por valor. Nome é o congelado
// na venda (produto pode ter sido renomeado ou excluído depois).
type RankedProduct = Omit<DashboardTopProduct, 'photoUrl'>

function topProducts(sales: DashboardSaleRow[]): RankedProduct[] {
  const byProduct = new Map<string, RankedProduct>()
  for (const sale of sales) {
    for (const item of sale.items) {
      const current = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        quantity: 0,
        totalCents: 0,
      }
      current.quantity += item.quantity
      current.totalCents += item.quantity * item.unitPriceCents
      byProduct.set(item.productId, current)
    }
  }
  return [...byProduct.values()]
    .sort((a, b) => b.quantity - a.quantity || b.totalCents - a.totalCents)
    .slice(0, DASHBOARD_TOP_PRODUCTS)
}
