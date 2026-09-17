import { useState } from 'react'
import { useAnonymizeOperator } from '@/hooks/queries/use-anonymize-operator'
import { useDeletedOperators } from '@/hooks/queries/use-deleted-operators'
import { useOperators } from '@/hooks/queries/use-operators'
import { useSetOperatorActive } from '@/hooks/queries/use-set-operator-active'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function useOperatorsPage() {
  const operators = useOperators()
  const setActive = useSetOperatorActive()

  // LGPD (08-seguranca § 13): só busca quem já foi excluído quando o
  // Administrador pede — não é tráfego do dia a dia.
  const [showDeleted, setShowDeleted] = useState(false)
  const deletedOperators = useDeletedOperators(showDeleted)
  const anonymize = useAnonymizeOperator()
  const [confirmingAnonymizeId, setConfirmingAnonymizeId] = useState<string | null>(null)

  return {
    operators: operators.data ?? [],
    isLoading: operators.isPending,
    loadErrorMessage: apiErrorMessage(operators.error),
    // LAST_ADMIN / SELF_CHANGE chegam daqui, como banner acima da lista.
    actionErrorMessage: apiErrorMessage(setActive.error),
    dismissActionError: setActive.reset,
    changingId: setActive.isPending ? setActive.variables.id : null,
    handleActiveChange: (id: string, active: boolean) => setActive.mutate({ id, active }),

    showDeleted,
    toggleShowDeleted: () => setShowDeleted((value) => !value),
    deletedOperators: deletedOperators.data ?? [],
    isLoadingDeleted: deletedOperators.isPending,
    deletedLoadErrorMessage: apiErrorMessage(deletedOperators.error),
    anonymizeErrorMessage: apiErrorMessage(anonymize.error),
    dismissAnonymizeError: anonymize.reset,
    anonymizingId: anonymize.isPending ? anonymize.variables : null,
    confirmingAnonymizeId,
    setConfirmingAnonymizeId,
    handleAnonymize: (id: string) => {
      anonymize.mutate(id)
      setConfirmingAnonymizeId(null)
    },
  }
}
