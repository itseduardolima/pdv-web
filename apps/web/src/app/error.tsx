'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { ServerErrorNotice } from '@/components/ui/ServerErrorNotice'

// Boundary de erro do App Router (abaixo do RootLayout — tenant já
// resolvido, ver layout.tsx): pega qualquer erro de render não tratado em
// qualquer página. Mensagem sempre genérica aqui — não é erro de regra de
// negócio vindo da API, é falha inesperada no cliente; o `error.message`
// original só vai pro console, nunca pra tela.
interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ServerErrorNotice
      message="Não foi possível carregar esta página agora. Tente novamente em alguns instantes."
      action={
        <Button onClick={reset} variant="secondary">
          Tentar novamente
        </Button>
      }
    />
  )
}
