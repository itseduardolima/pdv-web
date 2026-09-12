import type { LoginOperator } from '@pdv/shared'
import { Avatar } from '@/components/ui/Avatar'

const tones = ['accent', 'warning', 'danger'] as const

interface OperatorAvatarPickerProps {
  operators: LoginOperator[]
  selectedId: string | null
  onSelect: (operatorId: string) => void
}

export function OperatorAvatarPicker({ operators, selectedId, onSelect }: OperatorAvatarPickerProps) {
  return (
    <div role="radiogroup" aria-label="Operador" className="flex flex-wrap justify-center gap-4 sm:gap-5">
      {operators.map((operator, index) => {
        const selected = operator.id === selectedId
        return (
          <button
            key={operator.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(operator.id)}
            className="flex flex-col items-center gap-2"
          >
            <Avatar
              name={operator.name}
              photoUrl={operator.photoUrl}
              tone={tones[index % tones.length]}
              className={selected ? 'ring-4 ring-primary' : ''}
            />
            <span className={`font-body text-xs ${selected ? 'font-bold text-ink' : 'font-medium text-ink/60'}`}>
              {operator.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
