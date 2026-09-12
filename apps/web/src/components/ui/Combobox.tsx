'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FieldError } from './FieldError'
import { FieldLabel } from './FieldLabel'

interface ComboboxProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  hint?: string
  error?: string
  required?: boolean
  placeholder?: string
  name?: string
}

// Seletor com busca: digitar filtra a lista; Enter/clique escolhe. Texto
// que não está na lista também vale (a API decide se aceita).
export function Combobox({ label, value, onChange, options, hint, error, required, placeholder, name }: ComboboxProps) {
  const id = useId()
  const listId = `${id}-list`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const term = value.trim().toLocaleLowerCase('pt-BR')
    return term ? options.filter((option) => option.toLocaleLowerCase('pt-BR').includes(term)) : options
  }, [options, value])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(option: string) {
    onChange(option)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && filtered[activeIndex]) {
      event.preventDefault()
      select(filtered[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        className={`flex h-12 items-center rounded-input bg-canvas px-4 md:h-[52px] ${error ? 'border-2 border-danger' : 'border-2 border-transparent'}`}
      >
        <input
          id={id}
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Abrir opções"
          onClick={() => setOpen((state) => !state)}
          className="ml-2 text-ink/50"
        >
          ▾
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-input border border-border bg-surface p-1 shadow-nav"
        >
          {filtered.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer rounded-frame px-3 py-2 font-body text-sm ${index === activeIndex ? 'bg-primary text-primary-ink' : 'text-ink'}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      <FieldError id={errorId} message={error} />
      {hint && !error && (
        <p id={hintId} className="font-body text-xs text-ink/45">
          {hint}
        </p>
      )}
    </div>
  )
}
