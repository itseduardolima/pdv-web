import { syncSalesResultSchema } from '@pdv/shared'
import { apiRequest } from '@/lib/api-client'
import { isBackendUnreachable } from './products-cache'
import type { OfflineDb } from './db'
import { listPendingSales, removePendingSale } from './pending-sales'

// Evita duas sincronizações ao mesmo tempo (evento 'online' + intervalo +
// venda nova disparando juntos) — nunca manda o mesmo lote duas vezes.
const syncing = new Set<string>()

// HU 8.2: reenvia a fila pro POST /sales/sync (idempotente por uuid, em
// lote de até 200). Cada venda tem seu próprio resultado: só sai da fila
// local a que voltou `ok: true` — uma com erro de regra (ex.: sem estoque
// quando enfim sincronizou) fica pra alguém revisar, não trava as outras
// nem é descartada silenciosamente.
export async function syncPendingSales(db: OfflineDb, tenantId: string): Promise<void> {
  if (syncing.has(tenantId)) return
  syncing.add(tenantId)
  try {
    const pending = await listPendingSales(db)
    if (pending.length === 0) return

    const batch = pending.slice(0, 200)
    let response
    try {
      response = await apiRequest('/sales/sync', {
        method: 'POST',
        body: { sales: batch.map((item) => item.input) },
        schema: syncSalesResultSchema,
      })
    } catch (error) {
      if (isBackendUnreachable(error)) return // continua na fila, tenta de novo depois
      throw error
    }

    for (const result of response.results) {
      if (result.ok) await removePendingSale(db, result.uuid)
      else console.error(`Venda ${result.uuid} não sincronizou: ${result.error?.message ?? 'erro desconhecido'}`)
    }
  } finally {
    syncing.delete(tenantId)
  }
}
