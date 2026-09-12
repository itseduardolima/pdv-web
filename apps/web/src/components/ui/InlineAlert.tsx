import type { ReactNode } from 'react'
import { AlertIcon } from './Icons'

interface InlineAlertProps {
  variant?: 'danger' | 'warning'
  children: ReactNode
  onDismiss?: () => void
}

// Banner ancorado dentro do card da ação (DESIGN_SYSTEM.md § Validação e
// feedback). Substitui toast; o texto é sempre o que a API devolveu.
export function InlineAlert({ variant = 'danger', children, onDismiss }: InlineAlertProps) {
  const tone = variant === 'danger' ? 'bg-danger/[0.08] text-danger' : 'bg-warning/10 text-warning'
  return (
    <div role="alert" className={`flex w-full animate-slide-down items-start gap-3 rounded-card-sm px-4 py-3 ${tone}`}>
      <AlertIcon aria-hidden width="20" height="20" className="mt-0.5 shrink-0" />
      <p className="flex-1 font-body text-sm font-medium">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="shrink-0 font-body text-sm font-bold"
        >
          ×
        </button>
      )}
    </div>
  )
}
