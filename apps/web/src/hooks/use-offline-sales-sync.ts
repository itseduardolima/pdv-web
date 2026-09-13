import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getOfflineDb } from '@/lib/offline/db'
import { syncPendingSales } from '@/lib/offline/sync'

const FALLBACK_INTERVAL_MS = 30_000

// Sincroniza a fila offline (HU 8.2): ao montar (sobra de sessão anterior),
// quando a rede volta (evento 'online') e a cada 30s como fallback — o
// evento nem sempre dispara certo em todo navegador/rede. Monta uma vez no
// AppShell, roda em toda página autenticada, não só em Vender.
export function useOfflineSalesSync(tenantId: string): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const db = getOfflineDb(tenantId)
    const run = () =>
      void syncPendingSales(db, tenantId).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['products'] })
        void queryClient.invalidateQueries({ queryKey: ['cash-sessions'] })
      })

    run()
    window.addEventListener('online', run)
    const interval = setInterval(run, FALLBACK_INTERVAL_MS)
    return () => {
      window.removeEventListener('online', run)
      clearInterval(interval)
    }
  }, [tenantId, queryClient])
}
