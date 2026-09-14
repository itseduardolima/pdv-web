'use client'

import { Lottie } from 'lottie-react'
import loadingAnimation from './loading.json'

interface LoaderProps {
  size?: number
  label?: string
  className?: string
}

// Indicador de carregamento padrão do app — usar sempre que uma página/seção
// não tem dado nenhum ainda pra mostrar (nunca durante um refetch em segundo
// plano com dado já na tela, aí o conteúdo antigo continua visível).
export function Loader({ size = 64, label = 'Carregando', className = '' }: LoaderProps) {
  return (
    <div role="status" aria-label={label} className={`flex items-center justify-center ${className}`}>
      <Lottie src={loadingAnimation} loop autoplay style={{ width: size, height: size }} />
    </div>
  )
}
