import type { ReactNode } from 'react'
import { TotalAmount } from './TotalAmount'

interface TotalCardProps {
  label: string
  totalCents: number
  dataCy?: string
  // Linha de rodapé (pill + texto, ou só texto) — Fechamento e Dashboard
  // mostram informações diferentes aqui.
  children?: ReactNode
}

// Cartão escuro do valor do dia/caixa — Fechamento ("Total do caixa") e
// Dashboard ("Vendido hoje") usam o mesmo visual (decisão de 2026-09-13,
// 100% fiel ao protótipo): fundo **preto** (`--color-ink`) é o destaque; a
// cor primária do tenant entra só como detalhe — um brilho sutil no canto
// inferior direito, nunca misturada no preto inteiro (isso deixava o fundo
// esverdeado/oliva com tenants de primária amarela). Textura de pontinhos
// por cima, só a parte inteira do valor destacada na cor primária.
export function TotalCard({ label, totalCents, dataCy, children }: TotalCardProps) {
  return (
    <div className="relative flex flex-1 flex-col justify-between gap-3 overflow-hidden rounded-card bg-ink p-5 text-surface md:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.14]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-pill bg-primary/30 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1.4px,transparent_1.8px)] [background-size:22px_22px]"
      />
      <div className="relative">
        <p className="font-body text-[13px] font-medium text-surface/55">{label}</p>
        <p data-cy={dataCy} className="mt-1 font-heading text-[34px] font-bold tracking-tight md:text-[46px]">
          <TotalAmount cents={totalCents} />
        </p>
      </div>
      {children && <div className="relative flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  )
}
