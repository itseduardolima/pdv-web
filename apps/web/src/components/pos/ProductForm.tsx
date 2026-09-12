import { Controller, type UseFormReturn } from 'react-hook-form'
import type { FormEventHandler } from 'react'
import { PRODUCT_LIMITS, PRODUCT_UNIT_INFO, productUnitSchema } from '@pdv/shared'
import { Button, type ButtonState } from '@/components/ui/Button'
import { Combobox } from '@/components/ui/Combobox'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { Select } from '@/components/ui/Select'
import type { ProductFormValues } from '@/hooks/use-product-form'
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
  cancelHref: string
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
  cancelHref,
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
        <Input
          label="Código de barras"
          hint={`Opcional · até ${PRODUCT_LIMITS.barcode.max} caracteres · use o leitor ou digite`}
          inputMode="numeric"
          error={errors.barcode?.message}
          {...register('barcode')}
        />
      </aside>

      <section className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-4 md:p-[26px]">
        <Input
          label="Nome do produto"
          required
          hint={`De ${PRODUCT_LIMITS.name.min} a ${PRODUCT_LIMITS.name.max} caracteres · ex.: Arroz 5kg`}
          autoComplete="off"
          error={errors.name?.message}
          {...register('name')}
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
                hint={`Escolha da lista ou digite uma nova · até ${PRODUCT_LIMITS.category.max} caracteres`}
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
          <Input
            label="Preço de venda"
            required
            leading="R$"
            inputMode="decimal"
            placeholder="0,00"
            hint="Em reais, com centavos · ex.: 3,99"
            error={errors.salePrice?.message}
            {...register('salePrice')}
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
                hint={`Quantidade hoje · avisamos quando chegar a ${PRODUCT_LIMITS.defaultMinStock}`}
                error={errors.stockQuantity?.message}
              />
            )}
          />
        </div>

        {errorMessage && <InlineAlert onDismiss={onDismissError}>{errorMessage}</InlineAlert>}

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:gap-3">
          <Button type="submit" state={submitState} successLabel="Salvo">
            Salvar Produto
          </Button>
          <Button variant="secondary" href={cancelHref}>
            Cancelar
          </Button>
        </div>
      </section>
    </form>
  )
}
