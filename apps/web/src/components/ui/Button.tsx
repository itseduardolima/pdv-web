import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink',
  secondary: 'bg-ink text-surface',
  ghost: 'border border-ink text-ink',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

export function Button({ variant = 'primary', loading = false, className = '', disabled, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`rounded-pill px-8 py-4 font-body text-base font-medium transition-opacity disabled:opacity-60 ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
