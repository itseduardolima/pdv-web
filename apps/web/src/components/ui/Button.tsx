import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckIcon } from './Icons'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'
export type ButtonState = 'idle' | 'loading' | 'success'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink',
  secondary: 'bg-ink text-surface',
  ghost: 'border-[1.5px] border-ink text-ink',
}
const sizeClass: Record<Size, string> = {
  md: 'px-8 py-4 text-base',
  sm: 'px-6 py-3 text-sm',
}
const baseClass = 'inline-flex items-center justify-center gap-2 rounded-pill font-body font-medium transition-[opacity,transform] disabled:opacity-60'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  state?: ButtonState
  successLabel?: string
  href?: string
}

// state="loading": desabilita enquanto a API responde; state="success": check +
// rótulo por ~600ms antes da navegação (DESIGN_SYSTEM § Validação e feedback).
export function Button({
  variant = 'primary',
  size = 'md',
  state = 'idle',
  successLabel = 'Salvo',
  href,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = `${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${state === 'success' ? 'animate-pop' : ''} ${className}`
  const content: ReactNode =
    state === 'success' ? (
      <>
        <CheckIcon aria-hidden />
        {successLabel}
      </>
    ) : (
      children
    )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button
      type="button"
      aria-busy={state === 'loading' || undefined}
      data-state={state}
      disabled={disabled || state !== 'idle'}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  )
}
