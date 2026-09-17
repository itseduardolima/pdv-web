'use client'

import { Controller } from 'react-hook-form'
import { PLATFORM_TENANT_LIMITS } from '@pdv/shared'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlatformShell } from '@/components/platform/PlatformShell'
import { Button } from '@/components/ui/Button'
import { ColorSwatchList } from '@/components/ui/ColorSwatchList'
import { FieldError } from '@/components/ui/FieldError'
import { FieldLabel } from '@/components/ui/FieldLabel'
import { Input } from '@/components/ui/Input'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { env } from '@/lib/env'
import { initials } from '@/lib/utils/initials'
import { PinKeypad } from '@/components/pos/PinKeypad'
import { useNewPlatformTenantPage } from './use-new-platform-tenant-page'

export default function NewPlatformTenantPage() {
  const page = useNewPlatformTenantPage()
  const { control, formState } = page.form
  const errors = formState.errors

  return (
    <PlatformShell>
      <PageHeader title="Nova Loja" subtitle="Cadastre uma loja e o administrador dela" backHref="/platform/tenants" />

      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        <div className="flex flex-col gap-5 rounded-card bg-surface p-5 md:w-[280px] md:shrink-0">
          <div className="flex flex-col items-center gap-2 rounded-input bg-canvas p-5 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-frame font-heading text-2xl font-bold text-white"
              style={{ backgroundColor: page.primaryColor }}
            >
              {initials(page.name) || '—'}
            </div>
            <div className="font-heading text-[15px] font-bold">{page.name || 'Nome da loja'}</div>
            <div className="break-all font-body text-xs text-ink/40">
              {(page.slug || 'identificador') + '.' + env.appBaseDomain}
            </div>
          </div>
          <ColorSwatchList value={page.primaryColor} onChange={(hex) => page.form.setValue('primaryColor', hex)} />
        </div>

        <form
          onSubmit={page.handleSubmit}
          noValidate
          className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-5 md:p-6"
        >
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input
                label="Nome da loja"
                required
                placeholder="Ex.: Mercadinho da Maria"
                maxLength={PLATFORM_TENANT_LIMITS.name.max}
                error={errors.name?.message}
                {...field}
                onChange={(event) => page.handleNameChange(event.target.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="slug"
            render={({ field }) => (
              <Input
                label="Identificador (slug)"
                required
                placeholder="Ex.: mercadinho-da-maria"
                hint={`Vira o endereço: <identificador>.${env.appBaseDomain}`}
                maxLength={PLATFORM_TENANT_LIMITS.slug.max}
                autoComplete="off"
                error={errors.slug?.message}
                {...field}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="adminName"
              render={({ field }) => (
                <Input
                  label="Nome do administrador"
                  required
                  placeholder="Ex.: Maria Souza"
                  autoComplete="off"
                  error={errors.adminName?.message}
                  {...field}
                />
              )}
            />
            <Controller
              control={control}
              name="adminEmail"
              render={({ field }) => (
                <Input
                  label="E-mail do administrador"
                  type="email"
                  hint="Opcional · usado para recuperar o PIN"
                  autoComplete="off"
                  error={errors.adminEmail?.message}
                  {...field}
                />
              )}
            />
          </div>

          <div className="mt-auto flex flex-col items-center gap-2">
            <FieldLabel required>PIN inicial do administrador</FieldLabel>
            <PinKeypad
              pin={page.pin}
              onDigit={page.onPinDigit}
              onBackspace={page.onPinBackspace}
              onClear={page.onPinClear}
            />
            <FieldError id="admin-pin-error" message={page.pinError} />
          </div>

          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

          <div className="flex justify-end pt-2">
            <Button type="submit" state={page.submitState} successLabel="Loja criada" className="w-full sm:w-auto">
              Criar Loja
            </Button>
          </div>
        </form>
      </div>
    </PlatformShell>
  )
}
