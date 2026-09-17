import type { DeletedOperator } from '@pdv/shared'
import { Avatar } from '@/components/ui/Avatar'
import { Button, type ButtonState } from '@/components/ui/Button'
import { TrashIcon } from '@/components/ui/Icons'

interface DeletedOperatorCardProps {
  operator: DeletedOperator
  onAnonymize: () => void
  anonymizing?: boolean
}

// LGPD (08-seguranca § 13): linha de quem já foi excluído (soft-delete) —
// só leitura + a ação de remover o dado pessoal de vez, sem os controles
// normais de editar/PIN/ativo (não fazem sentido pra alguém que já saiu).
export function DeletedOperatorCard({ operator, onAnonymize, anonymizing = false }: DeletedOperatorCardProps) {
  const state: ButtonState = anonymizing ? 'loading' : 'idle'
  return (
    <article className="flex items-center gap-3 rounded-card-sm bg-surface p-3 opacity-70 md:gap-4 md:rounded-card md:p-5">
      <Avatar name={operator.name} photoUrl={operator.photoUrl} className="h-11 w-11 text-sm md:h-14 md:w-14" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-sm font-bold tracking-tight md:text-base">{operator.name}</h3>
        <p className="font-body text-[11px] text-ink/45 md:text-xs">Excluído</p>
      </div>
      {operator.anonymizedAt ? (
        <span className="font-body text-[11px] text-ink/45">Dados removidos</span>
      ) : (
        <Button variant="ghost" size="sm" state={state} onClick={onAnonymize} className="!border-danger !text-danger">
          <TrashIcon aria-hidden />
          Remover dados (LGPD)
        </Button>
      )}
    </article>
  )
}
