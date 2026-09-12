import type { ReactNode } from 'react'

interface FieldLabelProps {
  htmlFor?: string
  id?: string
  required?: boolean
  action?: ReactNode
  children: ReactNode
}

// Rótulo de campo: asterisco quando obrigatório e espaço para uma ação
// (ex.: botão de ajuda) alinhada à direita.
export function FieldLabel({ htmlFor, id, required, action, children }: FieldLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} id={id} className="font-body text-[13px] font-semibold text-ink">
        {children}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      {action}
    </div>
  )
}
