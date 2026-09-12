import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertIcon } from './Icons'
import { FieldError } from './FieldError'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, leading, trailing, className = '', id, ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="font-body text-[13px] font-semibold text-ink">
        {label}
      </label>
      <div
        className={`flex h-12 items-center gap-2 rounded-input bg-canvas px-4 md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
      >
        {leading && <span className="font-body text-sm text-ink/40">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-ink/35"
          {...rest}
        />
        {error ? <AlertIcon aria-hidden className="shrink-0 text-danger" /> : trailing}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
})
