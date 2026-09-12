'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { forwardRef, useId, type ReactNode } from 'react'
import { ChevronDownIcon } from './Icons'
import { FieldError } from './FieldError'
import { FieldLabel } from './FieldLabel'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  hint?: string
  error?: string
  options: SelectOption[]
  labelAction?: ReactNode
  required?: boolean
  placeholder?: string
  name?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
}

// Select customizado (Radix UI, headless): mesmo visual em todo campo de
// escolha em lista da loja (Categoria, Unidade) — nunca o menu nativo do
// navegador, que muda de estilo por sistema operacional.
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { label, hint, error, options, labelAction, required, placeholder, name, value, onChange, className = '' },
  ref,
) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const selected = options.find((option) => option.value === value)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={id} required={required} action={labelAction}>
        {label}
      </FieldLabel>
      <RadixSelect.Root value={value} onValueChange={onChange} name={name} required={required}>
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          className={`flex h-12 w-full items-center justify-between gap-2 rounded-input bg-canvas px-4 font-body text-[15px] text-ink outline-none data-[placeholder]:text-ink/35 md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
        >
          {/* Children explícitos: mostra certo já no primeiro render, sem
              depender do menu (Content) ter aberto uma vez para "aprender" o rótulo. */}
          <RadixSelect.Value placeholder={placeholder}>{selected?.label}</RadixSelect.Value>
          <RadixSelect.Icon className="shrink-0">
            <ChevronDownIcon aria-hidden className="text-ink/50" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-20 max-h-56 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-input border border-border bg-surface shadow-nav"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer select-none rounded-frame px-3 py-2 font-body text-sm text-ink outline-none data-[highlighted]:bg-primary data-[highlighted]:text-primary-ink"
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      <FieldError id={errorId} message={error} />
      {hint && !error && (
        <p id={hintId} className="font-body text-xs text-ink/45">
          {hint}
        </p>
      )}
    </div>
  )
})
