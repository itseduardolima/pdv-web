import { Controller, type UseFormReturn } from 'react-hook-form'
import type { ChangeEvent, FormEventHandler } from 'react'
import { PRODUCT_LIMITS, PRODUCT_UNIT_INFO, productUnitSchema } from '@pdv/shared'
import { Button, type ButtonState } from '@/components/ui/Button'
import { Combobox } from '@/components/ui/Combobox'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { Select } from '@/components/ui/Select'
import type { ProductFormValues } from '@/hooks/use-product-form'
import { maskMoneyInput } from '@/lib/utils/money'
import { PhotoUploadBox } from './PhotoUploadBox'
import { UnitHelpPopover } from './UnitHelpPopover'

const UNIT_OPTIONS = productUnitSchema.options.map((unit) => ({ value: unit, label: PRODUCT_UNIT_INFO[unit].label }))

interface ProductFormProps {
  form: UseFormReturn<ProductFormValues>
  categories: string[]
  onSubmit: FormEventHandler<HTMLFormElement>
  submitState: ButtonState
  errorMessage: string | null
  onDismissError: () => void
  onPhotoChange: (file: File) => void
  photoUploading: boolean
  photoError: string | null
}

export function ProductForm({
  form,
  categories,
  onSubmit,
  submitState,
  errorMessage,
  onDismissError,
  onPhotoChange,
  photoUploading,
  photoError,
}: ProductFormProps) {
  const { register, control, formState } = form
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
        <Controller
          control={control}
          name="barcode"
          render={({ field }) => (
            <Input
              label="Código de barras"
              placeholder="Ex.: 7891000100103"
              hint="Use o leitor ou digite"
              maxLength={PRODUCT_LIMITS.barcode.max}
              inputMode="numeric"
              error={errors.barcode?.message}
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              ref={field.ref}
              // Código de barras (EAN/UPC) é só numérico — nunca deixa digitar letra.
              onChange={(event: ChangeEvent<HTMLInputElement>) => field.onChange(event.target.value.replace(/\D/g, ''))}
            />
          )}
        />
      </aside>

      <section className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-4 md:p-[26px]">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Nome do produto"
              required
              placeholder="Ex.: Arroz 5kg"
              hint={`Mínimo de ${PRODUCT_LIMITS.name.min} caracteres`}
              maxLength={PRODUCT_LIMITS.name.max}
              autoComplete="off"
              error={errors.name?.message}
              {...field}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Combobox
                label="Categoria"
                required
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={categories}
                placeholder="Digite para buscar"
                hint="Escolha da lista ou digite uma nova"
                maxLength={PRODUCT_LIMITS.category.max}
                error={errors.category?.message}
              />
            )}
          />
          <Select
            label="Unidade"
            required
            options={UNIT_OPTIONS}
            hint="Como o produto é vendido"
            labelAction={<UnitHelpPopover />}
            error={errors.unit?.message}
            {...register('unit')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="salePrice"
            render={({ field }) => (
              <Input
                label="Preço de venda"
                required
                leading="R$"
                inputMode="decimal"
                placeholder="0,00"
                hint="Em reais, com centavos"
                error={errors.salePrice?.message}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(event: ChangeEvent<HTMLInputElement>) => field.onChange(maskMoneyInput(event.target.value))}
              />
            )}
          />
          <Controller
            control={control}
            name="stockQuantity"
            render={({ field }) => (
              <NumberStepper
                label="Estoque atual"
                required
                value={field.value}
                onChange={field.onChange}
                error={errors.stockQuantity?.message}
              />
            )}
          />
        </div>

        {errorMessage && <InlineAlert onDismiss={onDismissError}>{errorMessage}</InlineAlert>}

        <div className="mt-auto flex justify-end pt-2">
          <Button type="submit" state={submitState} successLabel="Salvo" className="w-full sm:w-auto">
            Salvar Produto
          </Button>
        </div>
      </section>
    </form>
  )
}
