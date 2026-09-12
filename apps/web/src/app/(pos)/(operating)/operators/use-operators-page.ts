import { useOperators } from '@/hooks/queries/use-operators'
import { useSetOperatorActive } from '@/hooks/queries/use-set-operator-active'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function useOperatorsPage() {
  const operators = useOperators()
  const setActive = useSetOperatorActive()

  return {
    operators: operators.data ?? [],
    isLoading: operators.isPending,
    loadErrorMessage: apiErrorMessage(operators.error),
    // LAST_ADMIN / SELF_CHANGE chegam daqui, como banner acima da lista.
    actionErrorMessage: apiErrorMessage(setActive.error),
    dismissActionError: setActive.reset,
    changingId: setActive.isPending ? setActive.variables.id : null,
    handleActiveChange: (id: string, active: boolean) => setActive.mutate({ id, active }),
  }
}
