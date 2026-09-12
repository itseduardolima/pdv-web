import { useId } from 'react'
import { FieldError } from './FieldError'

interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  error?: string
  min?: number
}

// Stepper do protótipo (Estoque atual): −/+ em volta do valor.
export function NumberStepper({ label, value, onChange, error, min = 0 }: NumberStepperProps) {
  const id = useId()
  const errorId = `${id}-error`
  const button =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-ink bg-surface font-body text-base leading-none text-ink'
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="font-body text-[13px] font-semibold text-ink">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        aria-describedby={error ? errorId : undefined}
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
        <output className="flex-1 text-center font-heading text-[15px] font-bold text-ink">{value}</output>
        <button type="button" aria-label="Aumentar" onClick={() => onChange(value + 1)} className={button}>
          +
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
