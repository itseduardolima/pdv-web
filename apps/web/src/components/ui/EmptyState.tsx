import type { ReactNode } from 'react'
import { EmptyBoxIllustration } from './EmptyBoxIllustration'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  size?: 'md' | 'sm'
  className?: string
}

// Estado vazio reutilizável: ilustração na cor do tenant + título + texto
// de apoio + ação opcional. Usar em toda lista/grid sem conteúdo.
export function EmptyState({ title, description, action, size = 'md', className = '' }: EmptyStateProps) {
  const compact = size === 'sm'
  return (
    <div
      data-cy="empty-state"
      className={`flex w-full flex-1 flex-col items-center justify-center self-stretch text-center ${compact ? 'gap-1 py-4' : 'gap-2 py-8'} ${className}`}
    >
      <EmptyBoxIllustration className={compact ? 'h-24 w-auto' : 'h-40 w-auto md:h-52'} />
      <p className={`font-heading font-bold tracking-tight ${compact ? 'text-sm' : 'text-lg'}`}>{title}</p>
      {description && (
        <p className={`max-w-xs font-body text-ink/50 ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
