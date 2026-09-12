'use client'

import { OPERATOR_LIMITS } from '@pdv/shared'
import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { useForgotPinPage } from './use-forgot-pin-page'

export default function ForgotPinPage() {
  const page = useForgotPinPage()

  return (
    <SplitAuthLayout>
      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">Esqueci meu PIN</h1>

      {page.sent ? (
        <div data-cy="forgot-sent" className="flex w-full max-w-[380px] flex-col items-center gap-3 text-center">
          <CheckCircleIcon aria-hidden className="h-12 w-12 text-accent" />
          <p className="font-body text-sm text-ink/70">
            Se houver um cadastro ativo com esse e-mail, o link para escolher um novo PIN chega em instantes. Ele vale
            por 1 hora.
          </p>
          <Button href="/login" variant="secondary" className="mt-2 w-full">
            Voltar ao Login
          </Button>
        </div>
      ) : (
        <form onSubmit={page.handleSubmit} noValidate className="flex w-full max-w-[380px] flex-col gap-4">
          <p className="text-center font-body text-sm text-ink/60">
            Digite o e-mail cadastrado pelo Administrador. Você recebe um link para escolher um novo PIN.
          </p>
          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            maxLength={OPERATOR_LIMITS.email.max}
            name="email"
            value={page.email}
            onChange={page.handleEmailChange}
            error={page.emailError ?? undefined}
          />
          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}
          <Button type="submit" state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
            Enviar link
          </Button>
          <Button href="/login" variant="ghost" size="sm" className="w-full">
            Voltar ao Login
          </Button>
        </form>
      )}
    </SplitAuthLayout>
  )
}
