'use client'

import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { OperatorAvatarPicker } from '@/components/pos/OperatorAvatarPicker'
import { PinKeypad } from '@/components/pos/PinKeypad'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { useTenant } from '@/hooks/use-tenant'
import { useLoginPage } from './use-login-page'

export default function LoginPage() {
  const tenant = useTenant()
  const page = useLoginPage()

  return (
    <SplitAuthLayout illustrationSrc="/login-illustration.png">
      <div className="flex flex-col items-center gap-1">
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo do tenant, domínio dinâmico
          <img src={tenant.logoUrl} alt="" className="h-14 w-14 rounded-frame object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-frame bg-primary font-heading text-2xl font-bold text-primary-ink">
            {tenant.name.charAt(0)}
          </span>
        )}
        <span className="font-heading text-sm font-bold tracking-tight">{tenant.name}</span>
      </div>

      <h1 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">Quem está no caixa?</h1>

      {page.operatorsError ? (
        <InlineAlert>{page.operatorsError}</InlineAlert>
      ) : (
        <OperatorAvatarPicker
          operators={page.operators}
          selectedId={page.selectedOperatorId}
          onSelect={page.handleSelectOperator}
        />
      )}

      <hr className="w-full border-border" />

      <PinKeypad
        pin={page.pin}
        onDigit={page.handleDigit}
        onBackspace={page.handleBackspace}
        onClear={page.handleClear}
        disabled={page.isSubmitting}
      />

      {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

      <Button onClick={page.handleSubmit} loading={page.isSubmitting} className="w-full max-w-[340px]">
        Entrar
      </Button>
    </SplitAuthLayout>
  )
}
