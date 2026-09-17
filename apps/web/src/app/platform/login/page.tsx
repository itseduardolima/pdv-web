'use client'

import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { usePlatformLoginPage } from './use-platform-login-page'

export default function PlatformLoginPage() {
  const page = usePlatformLoginPage()

  return (
    <SplitAuthLayout illustrationSrc="/cash-counter-illustration.png">
      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">Painel Superadmin</h1>
      <p className="text-center font-body text-sm text-ink/50">Gerencie as lojas do sistema</p>

      <form onSubmit={page.handleSubmit} className="flex w-full max-w-[340px] flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          autoComplete="username"
          required
          value={page.email}
          onChange={(event) => page.setEmail(event.target.value)}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={page.password}
          onChange={(event) => page.setPassword(event.target.value)}
        />

        {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

        <Button type="submit" state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
          Entrar
        </Button>
      </form>
    </SplitAuthLayout>
  )
}
