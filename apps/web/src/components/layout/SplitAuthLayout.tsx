import type { ReactNode } from 'react'

interface SplitAuthLayoutProps {
  illustrationSrc?: string
  children: ReactNode
}

// Ilustração neutra (sem marca) usada em todas as telas de split-screen.
const DEFAULT_ILLUSTRATION = '/store-illustration.svg'

// Tela dividida (Login, Abertura de Caixa, Venda Confirmada): ilustração
// sobre dot-grid à esquerda no desktop/tablet, só o painel no celular.
export function SplitAuthLayout({ illustrationSrc = DEFAULT_ILLUSTRATION, children }: SplitAuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas bg-[radial-gradient(circle,var(--color-border)_1.4px,transparent_1.8px)] [background-size:26px_26px] md:bg-none">
      <div className="hidden flex-1 items-center justify-center bg-[radial-gradient(circle,var(--color-border)_1.4px,transparent_1.8px)] [background-size:26px_26px] md:flex">
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustração estática */}
        <img src={illustrationSrc} alt="" className="h-auto w-[70%] max-w-[680px]" />
      </div>
      <section className="flex w-full flex-col items-center justify-center gap-5 px-6 py-8 md:m-8 md:ml-0 md:w-[540px] md:shrink-0 md:rounded-card md:bg-surface md:px-14 md:py-10">
        {children}
      </section>
    </div>
  )
}
