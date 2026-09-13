import type { ReactNode } from 'react'

interface SplitAuthLayoutProps {
  illustrationSrc?: string
  // Painel mais largo no desktop — usado no Login quando a loja tem muitos
  // operadores, pra grade de avatares caber mais por linha (2026-09-13).
  wide?: boolean
  children: ReactNode
}

// Ilustração neutra (sem marca) usada em todas as telas de split-screen.
const DEFAULT_ILLUSTRATION = '/store-illustration.svg'

// Tela dividida (Login, Abertura de Caixa, Venda Confirmada): ilustração
// sobre dot-grid só em telas bem largas (`xl:`, 1280px+) — tablet deitado
// (iPad ~1024-1194px de largura) ainda cai fora disso e não mostra a
// ilustração, senão ela "reaparece" só de virar o aparelho de lado
// (decisão de 2026-09-13). Sem ilustração, o painel vira largura cheia.
export function SplitAuthLayout({
  illustrationSrc = DEFAULT_ILLUSTRATION,
  wide = false,
  children,
}: SplitAuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas bg-[radial-gradient(circle,var(--color-border)_1.4px,transparent_1.8px)] [background-size:26px_26px] xl:bg-none">
      <div className="hidden flex-1 items-center justify-center bg-[radial-gradient(circle,var(--color-border)_1.4px,transparent_1.8px)] [background-size:26px_26px] xl:flex">
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustração estática */}
        <img src={illustrationSrc} alt="" className="h-auto w-[70%] max-w-[680px]" />
      </div>
      <section
        className={`flex w-full flex-col items-center justify-center gap-5 px-6 py-8 xl:m-8 xl:ml-0 xl:shrink-0 xl:rounded-card xl:bg-surface xl:px-14 xl:py-10 ${wide ? 'xl:w-[720px]' : 'xl:w-[540px]'}`}
      >
        {children}
      </section>
    </div>
  )
}
