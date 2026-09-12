import Link from 'next/link'
import { OPERATOR_ROLE_LABEL, type Operator } from '@pdv/shared'
import { Avatar } from '@/components/ui/Avatar'
import { EditIcon } from '@/components/ui/Icons'
import { Toggle } from '@/components/ui/Toggle'

interface OperatorCardProps {
  operator: Operator
  editHref: string
  onActiveChange: (active: boolean) => void
  changingActive?: boolean
}

// Linha da lista de Operadores (HU 6.1): papel em texto simples, toggle de
// ativo. Um componente: linha no celular, card a partir de md.
export function OperatorCard({ operator, editHref, onActiveChange, changingActive = false }: OperatorCardProps) {
  return (
    <article
      data-cy="operator-card"
      className={`flex items-center gap-3 rounded-card-sm bg-surface p-3 md:gap-4 md:rounded-card md:p-5 ${operator.active ? '' : 'opacity-60'}`}
    >
      <Avatar name={operator.name} photoUrl={operator.photoUrl} className="h-11 w-11 text-sm md:h-14 md:w-14" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-sm font-bold tracking-tight md:text-base">{operator.name}</h3>
        <p className="font-body text-[11px] text-ink/45 md:text-xs">
          {OPERATOR_ROLE_LABEL[operator.role]}
          {!operator.active && ' · inativo'}
        </p>
      </div>
      <Toggle
        checked={operator.active}
        onChange={onActiveChange}
        disabled={changingActive}
        label={`${operator.active ? 'Inativar' : 'Ativar'} ${operator.name}`}
      />
      <Link
        href={editHref}
        aria-label={`Editar ${operator.name}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-canvas text-ink"
      >
        <EditIcon aria-hidden />
      </Link>
    </article>
  )
}
