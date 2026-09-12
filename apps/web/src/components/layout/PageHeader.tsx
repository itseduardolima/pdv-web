import Link from 'next/link'
import type { ReactNode } from 'react'
import { BackIcon } from '@/components/ui/Icons'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  backHref?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-surface md:h-11 md:w-11"
          >
            <BackIcon aria-hidden />
          </Link>
        )}
        <div>
          <h1 className="font-heading text-[25px] font-bold leading-[1.05] tracking-tight md:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 font-body text-xs text-ink/45 md:text-[13px]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:gap-3">{actions}</div>}
    </header>
  )
}
