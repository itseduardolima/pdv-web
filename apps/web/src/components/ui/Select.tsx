import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDownIcon } from './Icons'
import { FieldError } from './FieldError'
import { FieldLabel } from './FieldLabel'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  labelAction?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, labelAction, className = '', id, required, ...rest },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={selectId} required={required} action={labelAction}>
        {label}
      </FieldLabel>
      {/* appearance-none esconde a seta nativa do navegador (que sai mais à
          direita e muda de estilo por browser); o chevron abaixo é o mesmo
          do Combobox, na mesma posição, para os dois campos ficarem iguais. */}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          className={`h-12 w-full appearance-none rounded-input bg-canvas py-0 pl-4 pr-10 font-body text-[15px] text-ink outline-none md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/50"
        />
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
