import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertIcon } from './Icons'
import { FieldError } from './FieldError'
import { FieldLabel } from './FieldLabel'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  // Texto de apoio (limites, exemplo). Só informa; quem valida é a API.
  hint?: string
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
  labelAction?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, labelAction, className = '', id, required, ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={inputId} required={required} action={labelAction}>
        {label}
      </FieldLabel>
      <div
        className={`flex h-12 items-center gap-2 rounded-input bg-canvas px-4 md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
      >
        {leading && <span className="font-body text-sm text-ink/40">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-ink/35"
          {...rest}
        />
        {error ? <AlertIcon aria-hidden className="shrink-0 text-danger" /> : trailing}
      </div>
      <FieldError id={errorId} message={error} />
      {hint && !error && (
        <p id={hintId} className="font-body text-xs text-ink/45">
          {hint}
        </p>
      )}
    </div>
  )
})
