'use client'

import { Suspense } from 'react'
import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { PinKeypad } from '@/components/pos/PinKeypad'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { useSetPinPage } from './use-set-pin-page'

// useSearchParams exige Suspense no App Router.
export default function SetPinPage() {
  return (
    <Suspense fallback={null}>
      <SetPinContent />
    </Suspense>
  )
}

function SetPinContent() {
  const page = useSetPinPage()

  return (
    <SplitAuthLayout>
      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">
        {page.purpose === 'FIRST_ACCESS' ? 'Bem-vindo ao caixa' : 'Novo PIN'}
      </h1>

      {page.isLoading && <p className="font-body text-sm text-ink/50">Conferindo o link...</p>}

      {page.linkError && !page.isLoading && (
        <div className="flex w-full max-w-[380px] flex-col gap-3">
          <InlineAlert>{page.linkError}</InlineAlert>
          <Button href="/forgot-pin" variant="secondary" className="w-full">
            Pedir um novo link
          </Button>
        </div>
      )}

      {page.done && (
        <div data-cy="set-pin-done" className="flex w-full max-w-[380px] flex-col items-center gap-3 text-center">
          <CheckCircleIcon aria-hidden className="h-12 w-12 text-accent" />
          <p className="font-body text-sm text-ink/70">PIN definido, {page.operatorName}. Agora é só entrar.</p>
          <Button href="/login" className="mt-2 w-full">
            Ir para o Login
          </Button>
        </div>
      )}

      {!page.linkError && !page.isLoading && !page.done && (
        <>
          <p className="text-center font-body text-sm text-ink/60">
            Olá, {page.operatorName}. Escolha um PIN de 4 dígitos para entrar no caixa.
          </p>
          <PinKeypad
            pin={page.pin}
            onDigit={page.handleDigit}
            onBackspace={page.handleBackspace}
            onClear={page.handleClear}
            disabled={page.isSubmitting}
          />
          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}
          <Button
            onClick={page.handleSubmit}
            state={page.isSubmitting ? 'loading' : 'idle'}
            className="w-full max-w-[340px]"
          >
            Salvar PIN
          </Button>
        </>
      )}
    </SplitAuthLayout>
  )
}
