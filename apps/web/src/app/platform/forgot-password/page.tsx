'use client'

import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { usePlatformForgotPasswordPage } from './use-platform-forgot-password-page'

export default function PlatformForgotPasswordPage() {
  const page = usePlatformForgotPasswordPage()

  return (
    <SplitAuthLayout illustrationSrc="/cash-counter-illustration.png">
      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">Esqueci minha senha</h1>

      {page.sent ? (
        <div className="flex w-full max-w-[380px] flex-col items-center gap-3 text-center">
          <CheckCircleIcon aria-hidden className="h-12 w-12 text-accent" />
          <p className="font-body text-sm text-ink/70">
            Se houver uma conta ativa com esse e-mail, o link para escolher uma nova senha chega em instantes. Ele vale
            por 1 hora.
          </p>
          <Button href="/platform/login" variant="secondary" className="mt-2 w-full">
            Voltar ao Login
          </Button>
        </div>
      ) : (
        <form onSubmit={page.handleSubmit} noValidate className="flex w-full max-w-[380px] flex-col gap-4">
          <p className="text-center font-body text-sm text-ink/60">
            Digite o e-mail da sua conta. Você recebe um link para escolher uma nova senha.
          </p>
          <Input
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            maxLength={160}
            name="email"
            value={page.email}
            onChange={page.handleEmailChange}
            error={page.emailError ?? undefined}
          />
          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}
          <Button type="submit" state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
            Enviar link
          </Button>
          <Button href="/platform/login" variant="ghost" size="sm" className="w-full">
            Voltar ao Login
          </Button>
        </form>
      )}
    </SplitAuthLayout>
  )
}
