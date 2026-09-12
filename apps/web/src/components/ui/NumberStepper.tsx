import { useId } from 'react'
import { FieldError } from './FieldError'
import { FieldLabel } from './FieldLabel'

interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  error?: string
  required?: boolean
  min?: number
}

// Stepper do protótipo (Estoque atual): −/+ em volta de um valor que também
// pode ser digitado.
export function NumberStepper({ label, value, onChange, hint, error, required, min = 0 }: NumberStepperProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const button =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface font-body text-base leading-none text-ink'

  function onInput(text: string) {
    const digits = text.replace(/\D/g, '')
    onChange(digits === '' ? min : Number(digits))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        role="group"
        aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
        className={`flex h-12 items-center gap-2 rounded-input bg-canvas px-2 md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
      >
        <button
          type="button"
          aria-label="Diminuir"
          onClick={() => onChange(Math.max(min, value - 1))}
          className={button}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onInput(event.target.value)}
          onFocus={(event) => event.target.select()}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent text-center font-heading text-[15px] font-bold text-ink outline-none"
        />
        <button type="button" aria-label="Aumentar" onClick={() => onChange(value + 1)} className={button}>
          +
        </button>
      </div>
      <FieldError id={errorId} message={error} />
      {hint && !error && (
        <p id={hintId} className="font-body text-xs text-ink/45">
          {hint}
        </p>
      )}
    </div>
  )
}
