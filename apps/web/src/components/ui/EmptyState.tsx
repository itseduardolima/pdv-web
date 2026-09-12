import type { ReactNode } from 'react'
import { EmptyBoxIllustration } from './EmptyBoxIllustration'
import { EmptyCartIllustration } from './EmptyCartIllustration'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  size?: 'md' | 'sm'
  // 'box' (padrão, listas em geral) ou 'cart' (carrinho vazio em Vender).
  illustration?: 'box' | 'cart'
  className?: string
}

const ILLUSTRATIONS = { box: EmptyBoxIllustration, cart: EmptyCartIllustration }

// Estado vazio reutilizável: ilustração na cor do tenant + título + texto
// de apoio + ação opcional. Usar em toda lista/grid sem conteúdo.
export function EmptyState({
  title,
  description,
  action,
  size = 'md',
  illustration = 'box',
  className = '',
}: EmptyStateProps) {
  const compact = size === 'sm'
  const Illustration = ILLUSTRATIONS[illustration]
  return (
    <div
      data-cy="empty-state"
      className={`flex w-full flex-1 flex-col items-center justify-center self-stretch text-center ${compact ? 'gap-1 py-4' : 'gap-2 py-8'} ${className}`}
    >
      <Illustration className={compact ? 'h-24 w-auto' : 'h-40 w-auto md:h-52'} />
      <p className={`font-heading font-bold tracking-tight ${compact ? 'text-sm' : 'text-lg'}`}>{title}</p>
      {description && (
        <p className={`max-w-xs font-body text-ink/50 ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
