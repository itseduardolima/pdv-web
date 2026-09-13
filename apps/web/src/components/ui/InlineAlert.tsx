import type { ReactNode } from 'react'
import { AlertIcon } from './Icons'

interface InlineAlertAction {
  label: string
  onClick: () => void
}

interface InlineAlertProps {
  variant?: 'danger' | 'warning'
  children: ReactNode
  // Atalho para resolver o motivo do aviso sem sair da tela (ex.: "Ajustar
  // estoque" num "sem estoque" — DESIGN_SYSTEM § Validação e feedback).
  action?: InlineAlertAction
  onDismiss?: () => void
}

// Banner ancorado dentro do card da ação (DESIGN_SYSTEM.md § Validação e
// feedback). Substitui toast; o texto é sempre o que a API devolveu.
export function InlineAlert({ variant = 'danger', children, action, onDismiss }: InlineAlertProps) {
  const tone = variant === 'danger' ? 'bg-danger/[0.08] text-danger' : 'bg-warning/10 text-warning'
  return (
    <div role="alert" className={`flex w-full animate-slide-down flex-col gap-2 rounded-card-sm px-4 py-3 ${tone}`}>
      {/* Texto sempre em linha cheia, nunca espremido ao lado de um botão —
          um nome de produto longo precisa de espaço para quebrar normal. */}
      <div className="flex items-start gap-3">
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
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="ml-8 self-start font-body text-sm font-bold underline underline-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
