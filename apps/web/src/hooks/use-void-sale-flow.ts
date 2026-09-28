import type { Sale } from '@pdv/shared'
import { useVoidSale } from '@/hooks/queries/use-void-sale'
import { useSession } from '@/hooks/use-session'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

// Anular venda a partir do SaleDetailsDialog (Histórico e Fechamento). Só o
// Administrador vê a ação; quem decide se a venda ainda é anulável é a API
// (`sale.voidable`) — aqui só se repassa o resultado para a tela atualizar.
export function useVoidSaleFlow(onVoided: (sale: Sale) => void) {
  const { operator } = useSession()
  const voidSale = useVoidSale()
  return {
    canVoid: operator.role === 'ADMIN',
    handleVoid: (sale: Sale, reason: string) => voidSale.mutate({ id: sale.id, reason }, { onSuccess: onVoided }),
    voidState: voidSale.isPending ? ('loading' as const) : ('idle' as const),
    voidError: apiErrorMessage(voidSale.error),
    resetVoid: voidSale.reset,
  }
}
