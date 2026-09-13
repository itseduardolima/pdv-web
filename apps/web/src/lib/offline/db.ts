import Dexie, { type EntityTable } from 'dexie'
import type { CreateSaleInput, Product } from '@pdv/shared'

interface MetaEntry {
  key: string
  value: string
}

export interface PendingSale {
  uuid: string
  input: CreateSaleInput
  queuedAt: string
}

// Banco local (IndexedDB) do caixa — 01-arquitetura § Offline-first.
// v1 (HU 8.1): catálogo. v2 (HU 8.2): fila de vendas pendentes de sincronizar.
export class OfflineDb extends Dexie {
  productsCache!: EntityTable<Product, 'id'>
  meta!: EntityTable<MetaEntry, 'key'>
  pendingSales!: EntityTable<PendingSale, 'uuid'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({ productsCache: 'id, barcode, category', meta: 'key' })
    this.version(2).stores({ productsCache: 'id, barcode, category', meta: 'key', pendingSales: 'uuid, queuedAt' })
  }
}

const instances = new Map<string, OfflineDb>()

// Um banco por tenant: o host já isola a origem no browser, mas o nome com
// o id garante que trocar de loja no mesmo host nunca mistura catálogo/fila.
export function getOfflineDb(tenantId: string): OfflineDb {
  let db = instances.get(tenantId)
  if (!db) {
    db = new OfflineDb(`pdv-web-${tenantId}`)
    instances.set(tenantId, db)
  }
  return db
}
