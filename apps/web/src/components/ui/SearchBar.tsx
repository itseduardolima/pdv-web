import type { InputHTMLAttributes } from 'react'
import { SearchIcon } from './Icons'

type SearchBarProps = InputHTMLAttributes<HTMLInputElement>

export function SearchBar({ className = '', ...rest }: SearchBarProps) {
  return (
    <label className={`flex h-12 items-center gap-2.5 rounded-input bg-surface px-4 ${className}`}>
      <SearchIcon aria-hidden className="shrink-0 text-accent" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink/40"
        {...rest}
      />
    </label>
  )
}
