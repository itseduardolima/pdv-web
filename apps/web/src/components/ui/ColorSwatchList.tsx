import { PRESET_COLORS } from '@/lib/colors'

interface ColorSwatchListProps {
  value: string
  onChange: (hex: string) => void
  colors?: string[]
  label?: string
}

// Lista de cores prontas: clique direto, sem seletor nem hex — pra quem
// não sabe código de cor só quer escolher de uma lista (HU 11.3).
export function ColorSwatchList({
  value,
  onChange,
  colors = PRESET_COLORS,
  label = 'Ou escolha uma cor pronta',
}: ColorSwatchListProps) {
  const normalized = value.toLowerCase()
  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-xs text-ink/50">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const selected = normalized === color.toLowerCase()
          return (
            <button
              key={color}
              type="button"
              aria-label={`Usar cor ${color}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              className={`h-8 w-8 shrink-0 rounded-pill ring-2 ring-offset-2 ring-offset-surface transition-transform ${
                selected ? 'scale-110 ring-ink' : 'ring-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          )
        })}
      </div>
    </div>
  )
}
