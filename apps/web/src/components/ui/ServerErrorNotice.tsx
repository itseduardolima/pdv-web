import type { ReactNode } from 'react'

interface ServerErrorNoticeProps {
  message: string
  action?: ReactNode
}

// Estado genérico de "algo deu errado no servidor" (backend fora do ar,
// erro inesperado em qualquer página) — sem tenant disponível em alguns
// casos (ex.: falha ao resolver o tenant), por isso não depende de
// TenantProvider nem de tema — cor neutra, ilustração estática.
export function ServerErrorNotice({ message, action }: ServerErrorNoticeProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático em /public */}
      <img src="/server-error-illustration.svg" alt="" className="h-48 w-auto md:h-60" />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-bold tracking-tight">Algo deu errado</h1>
        <p className="max-w-sm font-body text-sm text-ink/60">{message}</p>
      </div>
      {action}
    </main>
  )
}
