import type { CreateSaleInput } from '@pdv/shared'
import type { OfflineDb, PendingSale } from './db'

export async function queuePendingSale(db: OfflineDb, input: CreateSaleInput): Promise<void> {
  await db.pendingSales.put({ uuid: input.uuid, input, queuedAt: new Date().toISOString() })
}

export function listPendingSales(db: OfflineDb): Promise<PendingSale[]> {
  return db.pendingSales.orderBy('queuedAt').toArray()
}

export function countPendingSales(db: OfflineDb): Promise<number> {
  return db.pendingSales.count()
}

export function removePendingSale(db: OfflineDb, uuid: string): Promise<void> {
  return db.pendingSales.delete(uuid)
}
