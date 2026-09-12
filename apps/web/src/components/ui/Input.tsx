import { forwardRef, useId, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react'
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
  {
    label,
    hint,
    error,
    leading,
    trailing,
    labelAction,
    className = '',
    id,
    required,
    maxLength,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const counterId = `${inputId}-counter`

  // Campo controlado (value vem do form): contador lê direto do value.
  // Sem controle (register uncontrolled): acompanha via onChange local.
  const isControlled = value !== undefined
  const [uncontrolledLength, setUncontrolledLength] = useState(() =>
    typeof defaultValue === 'string' ? defaultValue.length : 0,
  )
  const length = isControlled ? String(value).length : uncontrolledLength

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setUncontrolledLength(event.target.value.length)
    onChange?.(event)
  }

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
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null, maxLength !== undefined ? counterId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-ink/35"
          {...rest}
        />
        {error ? <AlertIcon aria-hidden className="shrink-0 text-danger" /> : trailing}
      </div>
      <FieldError id={errorId} message={error} />
      {/* Texto de apoio e contador na mesma linha: apoio à esquerda, contador à direita. */}
      {((hint && !error) || maxLength !== undefined) && (
        <div className="flex items-baseline justify-between gap-3">
          {hint && !error ? (
            <p id={hintId} className="font-body text-xs text-ink/45">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {maxLength !== undefined && (
            <p id={counterId} className="shrink-0 font-body text-xs tabular-nums text-ink/40">
              {length}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
