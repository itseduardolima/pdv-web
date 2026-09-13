import type { LoginOperator } from '@pdv/shared'
import { Avatar } from '@/components/ui/Avatar'

const tones = ['accent', 'warning', 'danger'] as const

interface OperatorAvatarPickerProps {
  operators: LoginOperator[]
  selectedId: string | null
  onSelect: (operatorId: string) => void
}

// Acima disso a grade encolhe (avatar, fonte e espaçamento menores) pra
// caber mais gente visível antes de precisar rolar.
export const COMPACT_THRESHOLD = 8

// Altura máxima com rolagem própria (a grade não empurra o teclado de PIN
// pra fora da tela quando a loja tem muitos operadores) e nome truncado
// numa linha só, com o texto completo no title (equipe grande / nome
// comprido — decisão de 2026-09-12).
export function OperatorAvatarPicker({ operators, selectedId, onSelect }: OperatorAvatarPickerProps) {
  const compact = operators.length > COMPACT_THRESHOLD

  return (
    <div className="max-h-[248px] w-full overflow-y-auto">
      <div
        role="radiogroup"
        aria-label="Operador"
        className={`flex flex-wrap justify-center p-1 ${compact ? 'gap-2.5 sm:gap-3' : 'gap-4 sm:gap-5'}`}
      >
        {operators.map((operator, index) => {
          const selected = operator.id === selectedId
          return (
            <button
              key={operator.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(operator.id)}
              title={operator.name}
              className={`flex shrink-0 flex-col items-center ${compact ? 'w-12 gap-1 sm:w-[58px]' : 'w-16 gap-2 sm:w-[74px]'}`}
            >
              <Avatar
                name={operator.name}
                photoUrl={operator.photoUrl}
                tone={tones[index % tones.length]}
                className={`${compact ? 'h-9 w-9 text-[11px]' : ''} ${selected ? 'ring-4 ring-primary' : ''}`}
              />
              <span
                className={`w-full truncate text-center font-body ${compact ? 'text-[10px]' : 'text-xs'} ${selected ? 'font-bold text-ink' : 'font-medium text-ink/60'}`}
              >
                {operator.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
