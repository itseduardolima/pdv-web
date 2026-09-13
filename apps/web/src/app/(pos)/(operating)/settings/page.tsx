'use client'

import { Controller } from 'react-hook-form'
import { PageHeader } from '@/components/layout/PageHeader'
import { PhotoUploadBox } from '@/components/pos/PhotoUploadBox'
import { Button } from '@/components/ui/Button'
import { ColorInput } from '@/components/ui/ColorInput'
import { ColorPreviewCard } from '@/components/ui/ColorPreviewCard'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { BR_TIMEZONES } from '@/lib/timezones'
import { useSettingsPage } from './use-settings-page'

export default function SettingsPage() {
  const page = useSettingsPage()
  const { control, formState } = page.form
  const errors = formState.errors
  const logoUrl = page.form.watch('logoUrl')
  const primaryColor = page.form.watch('primaryColor')

  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados da loja" />

      <form onSubmit={page.handleSubmit} noValidate className="flex flex-1 flex-col gap-4 md:flex-row md:gap-5">
        <aside className="flex flex-col rounded-card bg-surface p-4 md:w-[260px] md:shrink-0 md:p-[22px]">
          <PhotoUploadBox
            value={logoUrl}
            onChange={page.handleLogoChange}
            uploading={page.logoUploading}
            error={page.logoError ?? errors.logoUrl?.message}
            label="Adicionar logo"
          />
        </aside>

        <section className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-4 md:p-[26px]">
          {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input
                label="Nome da loja"
                required
                placeholder="Ex.: Mercadinho da Maria"
                autoComplete="off"
                error={errors.name?.message}
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name="primaryColor"
            render={({ field }) => (
              <ColorInput
                label="Cor primária"
                name={field.name}
                required
                error={errors.primaryColor?.message}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <ColorPreviewCard primaryColor={primaryColor} />

          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select
                label="Fuso horário"
                required
                options={BR_TIMEZONES}
                error={errors.timezone?.message}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <div>
            <Button type="submit" state={page.submitState} successLabel="Salvo">
              Salvar
            </Button>
          </div>
        </section>
      </form>
    </>
  )
}
