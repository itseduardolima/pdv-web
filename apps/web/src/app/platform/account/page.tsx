'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { PLATFORM_ADMIN_LIMITS } from '@pdv/shared'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlatformShell } from '@/components/platform/PlatformShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { PasswordVisibilityToggle } from '@/components/ui/PasswordVisibilityToggle'
import { usePlatformAccountPage } from './use-platform-account-page'

export default function PlatformAccountPage() {
  const page = usePlatformAccountPage()
  const profile = page.profileForm
  const profileErrors = profile.formState.errors
  const password = page.passwordForm
  const passwordErrors = password.formState.errors
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  return (
    <PlatformShell>
      <PageHeader title="Minha Conta" subtitle="Seus dados de acesso ao painel" />

      <form
        onSubmit={page.handleProfileSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-card bg-surface p-5 md:p-6"
      >
        <h2 className="font-heading text-base font-bold tracking-tight">Perfil</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={profile.control}
            name="name"
            render={({ field }) => (
              <Input label="Nome" required autoComplete="off" error={profileErrors.name?.message} {...field} />
            )}
          />
          <Controller
            control={profile.control}
            name="email"
            render={({ field }) => (
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="off"
                error={profileErrors.email?.message}
                {...field}
              />
            )}
          />
        </div>

        {page.profileErrorMessage && (
          <InlineAlert onDismiss={page.dismissProfileError}>{page.profileErrorMessage}</InlineAlert>
        )}

        <div className="flex justify-end">
          <Button type="submit" state={page.profileSubmitState} successLabel="Salvo" className="w-full sm:w-auto">
            Salvar
          </Button>
        </div>
      </form>

      <form
        onSubmit={page.handlePasswordSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-card bg-surface p-5 md:p-6"
      >
        <h2 className="font-heading text-base font-bold tracking-tight">Senha</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={password.control}
            name="currentPassword"
            render={({ field }) => (
              <Input
                label="Senha atual"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                error={passwordErrors.currentPassword?.message}
                trailing={
                  <PasswordVisibilityToggle
                    visible={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((current) => !current)}
                  />
                }
                {...field}
              />
            )}
          />
          <Controller
            control={password.control}
            name="newPassword"
            render={({ field }) => (
              <Input
                label="Nova senha"
                type={showNewPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                maxLength={PLATFORM_ADMIN_LIMITS.password.max}
                error={passwordErrors.newPassword?.message}
                trailing={
                  <PasswordVisibilityToggle
                    visible={showNewPassword}
                    onToggle={() => setShowNewPassword((current) => !current)}
                  />
                }
                {...field}
              />
            )}
          />
        </div>

        {page.passwordErrorMessage && (
          <InlineAlert onDismiss={page.dismissPasswordError}>{page.passwordErrorMessage}</InlineAlert>
        )}

        <div className="flex justify-end">
          <Button type="submit" state={page.passwordSubmitState} successLabel="Alterada" className="w-full sm:w-auto">
            Alterar senha
          </Button>
        </div>
      </form>
    </PlatformShell>
  )
}
