import type { ReactNode } from 'react'

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
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="flex-1 font-body text-sm font-medium">{children}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Fechar aviso" className="shrink-0 font-body text-sm font-bold">
          ×
        </button>
      )}
    </div>
  )
}
