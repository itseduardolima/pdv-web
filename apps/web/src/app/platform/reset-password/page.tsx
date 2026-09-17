'use client'

import { Suspense, useState } from 'react'
import { PLATFORM_ADMIN_LIMITS } from '@pdv/shared'
import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Button } from '@/components/ui/Button'
import { CheckCircleIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { PasswordVisibilityToggle } from '@/components/ui/PasswordVisibilityToggle'
import { usePlatformResetPasswordPage } from './use-platform-reset-password-page'

// useSearchParams exige Suspense no App Router.
export default function PlatformResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PlatformResetPasswordContent />
    </Suspense>
  )
}

function PlatformResetPasswordContent() {
  const page = usePlatformResetPasswordPage()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <SplitAuthLayout illustrationSrc="/cash-counter-illustration.png">
      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">Redefinir senha</h1>

      {page.isLoading && <p className="font-body text-sm text-ink/50">Conferindo o link...</p>}

      {page.linkError && !page.isLoading && (
        <div className="flex w-full max-w-[380px] flex-col gap-3">
          <InlineAlert>{page.linkError}</InlineAlert>
          <Button href="/platform/forgot-password" variant="secondary" className="w-full">
            Pedir um novo link
          </Button>
        </div>
      )}

      {page.done && (
        <div className="flex w-full max-w-[380px] flex-col items-center gap-3 text-center">
          <CheckCircleIcon aria-hidden className="h-12 w-12 text-accent" />
          <p className="font-body text-sm text-ink/70">Senha redefinida, {page.adminName}. Agora é só entrar.</p>
          <Button href="/platform/login" className="mt-2 w-full">
            Ir para o Login
          </Button>
        </div>
      )}

      {!page.linkError && !page.isLoading && !page.done && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            page.handleSubmit()
          }}
          noValidate
          className="flex w-full max-w-[380px] flex-col gap-4"
        >
          <p className="text-center font-body text-sm text-ink/60">
            Olá, {page.adminName}. Escolha uma nova senha para o painel.
          </p>
          <Input
            label="Nova senha"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            maxLength={PLATFORM_ADMIN_LIMITS.password.max}
            value={page.newPassword}
            onChange={(event) => page.handlePasswordChange(event.target.value)}
            error={page.passwordError ?? undefined}
            trailing={
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            }
          />
          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}
          <Button type="submit" state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
            Salvar senha
          </Button>
        </form>
      )}
    </SplitAuthLayout>
  )
}
