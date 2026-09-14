'use client'

import { useEffect, useRef } from 'react'
import type { AnimationItem } from 'lottie-web'
import loadingAnimation from './loading.json'

interface LoaderProps {
  size?: number
  label?: string
  className?: string
}

// Indicador de carregamento padrão do app — usar sempre que uma página/seção
// não tem dado nenhum ainda pra mostrar (nunca durante um refetch em segundo
// plano com dado já na tela, aí o conteúdo antigo continua visível).
// lottie-web só roda no cliente (usa DOM), por isso o import dinâmico dentro
// do useEffect em vez de import estático no topo do arquivo.
export function Loader({ size = 64, label = 'Carregando', className = '' }: LoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animation: AnimationItem | undefined
    let cancelled = false

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: loadingAnimation,
      })
    })

    return () => {
      cancelled = true
      animation?.destroy()
    }
  }, [])

  return (
    <div role="status" aria-label={label} className={`flex items-center justify-center ${className}`}>
      <div ref={containerRef} style={{ width: size, height: size }} />
    </div>
  )
}
