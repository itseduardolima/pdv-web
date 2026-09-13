import { Input } from './Input'

interface ColorInputProps {
  label: string
  name?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

// Campo de cor: swatch grande (<input type="color">, abre o seletor visual
// nativo do navegador — arrasta matiz/saturação, sem precisar saber hex) +
// hex digitável para quem já sabe o código. Backend valida o formato (11.3).
export function ColorInput({ label, name, value, onChange, error, required }: ColorInputProps) {
  return (
    <Input
      label={label}
      name={name}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={7}
      placeholder="#000000"
      error={error}
      leading={
        <input
          type="color"
          aria-label={`Cor: ${label}`}
          value={HEX_RE.test(value) ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-card-sm border-none bg-transparent p-0"
        />
      }
    />
  )
}
