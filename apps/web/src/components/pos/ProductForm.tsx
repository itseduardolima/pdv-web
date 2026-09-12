import { Controller, type UseFormReturn } from 'react-hook-form'
import type { FormEventHandler } from 'react'
import { Button, type ButtonState } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { Select } from '@/components/ui/Select'
import { PhotoUploadBox } from './PhotoUploadBox'
import type { ProductFormValues } from '@/hooks/use-product-form'

const UNIT_OPTIONS = [
  { value: 'UN', label: 'Un (unidade)' },
  { value: 'KG', label: 'Kg (quilo)' },
  { value: 'L', label: 'L (litro)' },
  { value: 'PCT', label: 'Pct (pacote)' },
  { value: 'CX', label: 'Cx (caixa)' },
]

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
  const photoUrl = form.watch('photoUrl')
  const errors = formState.errors
  const categoriesListId = 'product-categories'

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-4 md:flex-row md:gap-5">
      <aside className="flex flex-col gap-3.5 rounded-card bg-surface p-4 md:w-[260px] md:shrink-0 md:p-[22px]">
        <PhotoUploadBox value={photoUrl} onChange={onPhotoChange} uploading={photoUploading} error={photoError ?? errors.photoUrl?.message} />
        <Input label="Código de barras" inputMode="numeric" error={errors.barcode?.message} {...register('barcode')} />
      </aside>

      <section className="flex flex-1 flex-col gap-4 rounded-card bg-surface p-4 md:p-[26px]">
        <Input label="Nome do produto" autoComplete="off" error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Categoria" list={categoriesListId} autoComplete="off" error={errors.category?.message} {...register('category')} />
          <datalist id={categoriesListId}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <Select label="Unidade" options={UNIT_OPTIONS} error={errors.unit?.message} {...register('unit')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Preço de venda" leading="R$" inputMode="decimal" placeholder="0,00" error={errors.salePrice?.message} {...register('salePrice')} />
          <Input label="Preço de custo" leading="R$" inputMode="decimal" placeholder="0,00" error={errors.costPrice?.message} {...register('costPrice')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="stockQuantity"
            render={({ field }) => (
              <NumberStepper label="Estoque atual" value={field.value} onChange={field.onChange} error={errors.stockQuantity?.message} />
            )}
          />
          <Input label="Estoque mínimo" inputMode="numeric" error={errors.minStock?.message} {...register('minStock')} />
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
