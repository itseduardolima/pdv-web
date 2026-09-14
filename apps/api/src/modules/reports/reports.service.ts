import { Injectable } from '@nestjs/common'
import {
  REPORT_STAGNANT_PRODUCTS,
  REPORT_STAGNANT_THRESHOLD_UNITS,
  REPORT_TOP_PRODUCTS,
  type PaymentMethod,
  type ReportDay,
  type ReportHour,
  type ReportMonth,
  type ReportOperator,
  type ReportStagnantProduct,
  type ReportSummary,
  type ReportSummaryQuery,
  type ReportTopProduct,
} from '@pdv/shared'
import {
  addDaysToDayKey,
  dayKeyInTimeZone,
  hourInTimeZone,
  isValidTimeZone,
  startOfDayInTimeZone,
  yearMonthInTimeZone,
} from '../../common/utils/time-zone'
import { ReportsRepository, type ReportSaleRow } from './reports.repository'

const FALLBACK_TIME_ZONE = 'UTC'
// "Semana" é janela corrida (não semana-calendário) — mesmo raciocínio do
// Dashboard, sempre os últimos 7 dias terminando hoje. "Mês" e "Ano" são
// mês/ano-calendário mesmo, do dia 1 até o fim do período (incluindo dias
// futuros do próprio mês/ano, que aparecem zerados — ver resolveRange).
const WEEK_DAYS = 7

@Injectable()
export class ReportsService {
  constructor(private readonly reports: ReportsRepository) {}

  async summary(tenantId: string, query: ReportSummaryQuery, now: Date = new Date()): Promise<ReportSummary> {
    const timeZone = await this.resolveTimeZone(tenantId)
    const today = dayKeyInTimeZone(now, timeZone)
    const { fromKey, toKey } = resolveRange(query, today)

    const from = startOfDayInTimeZone(fromKey, timeZone)
    const to = startOfDayInTimeZone(addDaysToDayKey(toKey, 1), timeZone)
    const sales = await this.reports.findSalesBetween(tenantId, from, to)

    const durationDays = dayKeyDiff(fromKey, toKey) + 1
    const prevToKey = addDaysToDayKey(fromKey, -1)
    const prevFromKey = addDaysToDayKey(prevToKey, -(durationDays - 1))
    const prevFrom = startOfDayInTimeZone(prevFromKey, timeZone)
    const prevTo = startOfDayInTimeZone(addDaysToDayKey(prevToKey, 1), timeZone)
    const previousTotalCents = await this.reports.sumTotalBetween(tenantId, prevFrom, prevTo)

    const totalCents = sales.reduce((sum, sale) => sum + sale.totalCents, 0)

    const byDay = new Map<string, ReportSaleRow[]>()
    for (const sale of sales) {
      const key = dayKeyInTimeZone(sale.soldAt, timeZone)
      byDay.set(key, [...(byDay.get(key) ?? []), sale])
    }
    const days: ReportDay[] = []
    for (let offset = 0; offset < durationDays; offset += 1) {
      const date = addDaysToDayKey(fromKey, offset)
      const daySales = byDay.get(date) ?? []
      days.push({ date, totalCents: daySales.reduce((s, x) => s + x.totalCents, 0), salesCount: daySales.length })
    }

    // HU 12.4: "Hoje" quebra por horário em vez de um único bloco de 1 dia
    // — os demais períodos não têm "hoje" fazendo sentido como granularidade.
    const hours: ReportHour[] = query.period === 'today' ? buildHourly(sales, timeZone) : []
    // "Ano" quebra pelos 12 meses do ano corrente, não pelos ~260 dias
    // corridos desde 1º de janeiro — 365 barras diárias não cabem em tela
    // nenhuma de um jeito legível.
    const months: ReportMonth[] = query.period === 'year' ? buildMonthly(sales, timeZone) : []

    const top = rankTopProducts(sales)
    const productIds = top.map((p) => p.productId)
    const photos = await this.reports.findProductPhotos(tenantId, productIds)
    const topProducts: ReportTopProduct[] = top.map((p) => ({ ...p, photoUrl: photos.get(p.productId) ?? null }))

    const byOperator = rankByOperator(sales, totalCents)

    const activeProducts = await this.reports.findActiveProducts(tenantId)
    const stagnantProducts = rankStagnantProducts(sales, activeProducts)

    return {
      period: query.period,
      from: fromKey,
      to: toKey,
      totalCents,
      salesCount: sales.length,
      previousPeriod: {
        totalCents: previousTotalCents,
        deltaPercent:
          previousTotalCents === 0 ? null : Math.round(((totalCents - previousTotalCents) / previousTotalCents) * 100),
      },
      byPaymentMethod: totalsByPaymentMethod(sales),
      days,
      hours,
      months,
      topProducts,
      byOperator,
      stagnantProducts,
    }
  }

  private async resolveTimeZone(tenantId: string): Promise<string> {
    const stored = await this.reports.findTimeZone(tenantId)
    return stored && isValidTimeZone(stored) ? stored : FALLBACK_TIME_ZONE
  }
}

function resolveRange(query: ReportSummaryQuery, today: string): { fromKey: string; toKey: string } {
  switch (query.period) {
    case 'today':
      return { fromKey: today, toKey: today }
    case 'week':
      return { fromKey: addDaysToDayKey(today, -(WEEK_DAYS - 1)), toKey: today }
    case 'month': {
      // Mês-calendário: dia 1 até o último dia do mês corrente (não os
      // últimos 30 dias corridos) — inclui dias futuros do próprio mês,
      // que aparecem zerados (mesmo raciocínio do "Ano" com meses futuros).
      const [year, month] = today.split('-').map(Number) as [number, number]
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
      return { fromKey: `${today.slice(0, 7)}-01`, toKey: `${today.slice(0, 7)}-${String(lastDay).padStart(2, '0')}` }
    }
    case 'year':
      // Ano-calendário: 1º de janeiro do ano corrente até hoje (não os
      // últimos 365 dias corridos) — o gráfico mostra os 12 meses do ano.
      return { fromKey: `${today.slice(0, 4)}-01-01`, toKey: today }
    case 'custom':
      // Validado pelo schema (VALIDATION 400 se ausente) antes de chegar aqui.
      return { fromKey: query.from as string, toKey: query.to as string }
  }
}

// Diferença em dias entre dois dayKeys ("YYYY-MM-DD"), sem depender de fuso.
function dayKeyDiff(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number) as [number, number, number]
  const [ty, tm, td] = toKey.split('-').map(Number) as [number, number, number]
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / msPerDay)
}

// HU 12.4: 24 horas, zero-filled — mesmo raciocínio de `days`, uma hora
// sem venda entra como 0 em vez de sumir do gráfico.
function buildHourly(sales: ReportSaleRow[], timeZone: string): ReportHour[] {
  const byHour = new Map<number, ReportSaleRow[]>()
  for (const sale of sales) {
    const hour = hourInTimeZone(sale.soldAt, timeZone)
    byHour.set(hour, [...(byHour.get(hour) ?? []), sale])
  }
  return Array.from({ length: 24 }, (_, hour) => {
    const hourSales = byHour.get(hour) ?? []
    return { hour, totalCents: hourSales.reduce((s, x) => s + x.totalCents, 0), salesCount: hourSales.length }
  })
}

// HU 12.4: 12 meses do ano corrente, zero-filled (inclui meses futuros do
// próprio ano, que naturalmente não têm venda nenhuma ainda). `sales` já
// vem só do intervalo do período (1º/jan até hoje), então basta agrupar
// por mês — nunca tem venda de outro ano misturada aqui.
function buildMonthly(sales: ReportSaleRow[], timeZone: string): ReportMonth[] {
  const byMonth = new Map<number, ReportSaleRow[]>()
  for (const sale of sales) {
    const { month } = yearMonthInTimeZone(sale.soldAt, timeZone)
    byMonth.set(month, [...(byMonth.get(month) ?? []), sale])
  }
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthSales = byMonth.get(month) ?? []
    return { month, totalCents: monthSales.reduce((s, x) => s + x.totalCents, 0), salesCount: monthSales.length }
  })
}

function totalsByPaymentMethod(sales: ReportSaleRow[]): Record<PaymentMethod, number> {
  const totals: Record<PaymentMethod, number> = { CASH: 0, CARD: 0, PIX: 0 }
  for (const sale of sales) totals[sale.paymentMethod] += sale.totalCents
  return totals
}

type RankedProduct = Omit<ReportTopProduct, 'photoUrl'>

// Mais vendidos por quantidade; empate resolve por valor. Nome é o
// congelado na venda (produto pode ter sido renomeado ou excluído depois).
function rankTopProducts(sales: ReportSaleRow[]): RankedProduct[] {
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
    .slice(0, REPORT_TOP_PRODUCTS)
}

function rankByOperator(sales: ReportSaleRow[], totalCents: number): ReportOperator[] {
  const byOperator = new Map<string, { name: string; totalCents: number }>()
  for (const sale of sales) {
    const current = byOperator.get(sale.operatorId) ?? { name: sale.operatorName, totalCents: 0 }
    current.totalCents += sale.totalCents
    byOperator.set(sale.operatorId, current)
  }
  return [...byOperator.entries()]
    .map(([operatorId, v]) => ({
      operatorId,
      name: v.name,
      totalCents: v.totalCents,
      percent: totalCents === 0 ? 0 : Math.round((v.totalCents / totalCents) * 100),
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
}

// HU 12.7: produtos ativos vendidos <= REPORT_STAGNANT_THRESHOLD_UNITS no
// período — inclui quem vendeu 0 (não aparece em `sales` de jeito nenhum),
// por isso parte da lista de produtos ativos, não das vendas.
function rankStagnantProducts(
  sales: ReportSaleRow[],
  activeProducts: { id: string; name: string; photoUrl: string | null }[],
): ReportStagnantProduct[] {
  const soldByProduct = new Map<string, number>()
  for (const sale of sales) {
    for (const item of sale.items) {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return activeProducts
    .map((product) => ({
      productId: product.id,
      name: product.name,
      photoUrl: product.photoUrl,
      quantitySold: soldByProduct.get(product.id) ?? 0,
    }))
    .filter((p) => p.quantitySold <= REPORT_STAGNANT_THRESHOLD_UNITS)
    .sort((a, b) => a.quantitySold - b.quantitySold)
    .slice(0, REPORT_STAGNANT_PRODUCTS)
}
