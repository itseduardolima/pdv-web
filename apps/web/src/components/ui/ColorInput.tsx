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

// Campo de cor: swatch nativo (<input type="color">) + hex digitável — o
// backend valida o formato (03/11.3), aqui é só conveniência de escolha.
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
          className="h-7 w-7 shrink-0 cursor-pointer rounded-pill border-none bg-transparent p-0"
        />
      }
    />
  )
}
