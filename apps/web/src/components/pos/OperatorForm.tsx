import { Controller, type UseFormReturn } from 'react-hook-form'
import type { ChangeEvent, FormEventHandler } from 'react'
import { OPERATOR_LIMITS, OPERATOR_ROLE_LABEL, operatorRoleSchema } from '@pdv/shared'
import { Button, type ButtonState } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { OperatorFormValues } from '@/hooks/use-operator-form'
import { PhotoUploadBox } from './PhotoUploadBox'

const ROLE_OPTIONS = operatorRoleSchema.options.map((role) => ({ value: role, label: OPERATOR_ROLE_LABEL[role] }))

interface OperatorFormProps {
  form: UseFormReturn<OperatorFormValues>
  // Criação pede o PIN inicial; edição troca o PIN em ação separada.
  withPin: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  submitState: ButtonState
  errorMessage: string | null
  onDismissError: () => void
  onPhotoChange: (file: File) => void
  photoUploading: boolean
  photoError: string | null
}

export function OperatorForm({
  form,
  withPin,
  onSubmit,
  submitState,
  errorMessage,
  onDismissError,
  onPhotoChange,
  photoUploading,
  photoError,
}: OperatorFormProps) {
  const { control, formState } = form
  const errors = formState.errors
  const photoUrl = form.watch('photoUrl')

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4 md:flex-row md:gap-5">
      <aside className="flex flex-col gap-3.5 rounded-card bg-surface p-4 md:w-[260px] md:shrink-0 md:p-[22px]">
        <PhotoUploadBox
          value={photoUrl}
          onChange={onPhotoChange}
          uploading={photoUploading}
          error={photoError ?? errors.photoUrl?.message}
        />
      </aside>

      <section className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-4 md:p-[26px]">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Nome completo"
              required
              placeholder="Ex.: Maria Souza"
              hint={`Mínimo de ${OPERATOR_LIMITS.name.min} caracteres`}
              maxLength={OPERATOR_LIMITS.name.max}
              autoComplete="off"
              error={errors.name?.message}
              {...field}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                label="Papel"
                required
                options={ROLE_OPTIONS}
                hint="Administrador gerencia produtos e equipe"
                error={errors.role?.message}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                ref={field.ref}
              />
            )}
          />
          {withPin && (
            <Controller
              control={control}
              name="pin"
              render={({ field }) => (
                <Input
                  label="PIN inicial"
                  required
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="••••"
                  hint={`${OPERATOR_LIMITS.pinLength} dígitos, usado para entrar no caixa`}
                  maxLength={OPERATOR_LIMITS.pinLength}
                  error={errors.pin?.message}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    field.onChange(event.target.value.replace(/\D/g, ''))
                  }
                />
              )}
            />
          )}
        </div>

        {errorMessage && <InlineAlert onDismiss={onDismissError}>{errorMessage}</InlineAlert>}

        <div className="mt-auto flex justify-end pt-2">
          <Button type="submit" state={submitState} successLabel="Salvo" className="w-full sm:w-auto">
            Salvar Operador
          </Button>
        </div>
      </section>
    </form>
  )
}
