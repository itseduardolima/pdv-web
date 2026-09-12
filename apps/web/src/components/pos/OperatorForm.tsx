import { Controller, type UseFormReturn } from 'react-hook-form'
import type { ChangeEvent, FormEventHandler, ReactNode } from 'react'
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
  // Slots da edição: bloco abaixo dos dados (Resetar PIN, que é outro
  // <form>) e bloco abaixo da foto (zona de risco). Ficam fora do <form>
  // dos dados — formulário dentro de formulário não existe em HTML.
  after?: ReactNode
  asideExtra?: ReactNode
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
  after,
  asideExtra,
}: OperatorFormProps) {
  const { control, formState } = form
  const errors = formState.errors
  const photoUrl = form.watch('photoUrl')
  // Só marcação visual (o `*`): a regra em si é da API (03 § Autenticação).
  const role = form.watch('role')
  const email = form.watch('email')

  return (
    // Grade em duas linhas: foto | dados, zona de risco | Resetar PIN. Cada
    // linha tem a altura do card mais alto, e o par se alinha a ela. No celular vira uma coluna só,
    // na ordem foto, dados, PIN, excluir.
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr] md:gap-5">
      <aside className="flex flex-col justify-center rounded-card bg-surface p-4 md:col-start-1 md:row-start-1 md:p-[22px]">
        <PhotoUploadBox
          value={photoUrl}
          onChange={onPhotoChange}
          uploading={photoUploading}
          error={photoError ?? errors.photoUrl?.message}
        />
      </aside>

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-card bg-surface p-4 md:col-start-2 md:row-start-1 md:p-[26px]"
      >
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

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              label="E-mail"
              required={role === 'ADMIN'}
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="Ex.: maria@exemplo.com"
              hint={
                role === 'ADMIN'
                  ? 'Obrigatório para Administrador: é por ele que se recupera o PIN'
                  : 'Opcional · recebe o link para definir ou recuperar o PIN'
              }
              maxLength={OPERATOR_LIMITS.email.max}
              error={errors.email?.message}
              {...field}
            />
          )}
        />

        <div className={`grid grid-cols-1 gap-4 ${withPin ? 'sm:grid-cols-2' : ''}`}>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                label="Papel"
                required
                placeholder="Selecione o papel"
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
                  required={email.trim() === ''}
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="••••"
                  hint={
                    email.trim() === ''
                      ? `${OPERATOR_LIMITS.pinLength} dígitos, usado para entrar no caixa`
                      : 'Opcional: sem PIN, o operador define o dele pelo link do e-mail'
                  }
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

        <div className="flex justify-end pt-2">
          <Button type="submit" state={submitState} successLabel="Salvo" className="w-full sm:w-auto">
            Salvar Operador
          </Button>
        </div>
      </form>

      {after && <div className="md:col-start-2 md:row-start-2">{after}</div>}
      {asideExtra && <div className="md:col-start-1 md:row-start-2">{asideExtra}</div>}
    </div>
  )
}
