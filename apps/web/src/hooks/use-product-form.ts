import { useForm } from 'react-hook-form'
import type { CreateProductInput, Product, ProductUnit } from '@pdv/shared'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'
import { formatMoneyInput, parseIntegerInput, parseMoneyInput } from '@/lib/utils/money'

// Valores como o usuário digita; a conversão para a API acontece no submit.
export interface ProductFormValues {
  name: string
  category: string
  unit: ProductUnit
  barcode: string
  salePrice: string
  costPrice: string
  stockQuantity: number
  minStock: string
}

export const emptyProductFormValues: ProductFormValues = {
  name: '',
  category: '',
  unit: 'UN',
  barcode: '',
  salePrice: '',
  costPrice: '',
  stockQuantity: 0,
  minStock: '',
}

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    unit: product.unit,
    barcode: product.barcode ?? '',
    salePrice: formatMoneyInput(product.salePriceCents),
    costPrice: formatMoneyInput(product.costPriceCents),
    stockQuantity: product.stockQuantity,
    minStock: String(product.minStock),
  }
}

export function formValuesToInput(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name,
    category: values.category,
    unit: values.unit,
    barcode: values.barcode,
    salePriceCents: parseMoneyInput(values.salePrice),
    costPriceCents: parseMoneyInput(values.costPrice),
    stockQuantity: values.stockQuantity,
    minStock: parseIntegerInput(values.minStock),
  }
}

// Campo da API -> campo do formulário (nomes diferem onde há conversão).
const API_TO_FORM_FIELD: Record<string, keyof ProductFormValues> = {
  name: 'name',
  category: 'category',
  unit: 'unit',
  barcode: 'barcode',
  salePriceCents: 'salePrice',
  costPriceCents: 'costPrice',
  stockQuantity: 'stockQuantity',
  minStock: 'minStock',
}

// React Hook Form sem resolver: só estado de campo. Validação é da API; um 400
// VALIDATION vira erro embaixo de cada campo e foca o primeiro (10.1).
export function useProductForm(defaultValues: ProductFormValues = emptyProductFormValues) {
  const form = useForm<ProductFormValues>({ defaultValues })

  function applyApiErrors(error: unknown): boolean {
    const fieldErrors = apiFieldErrors(error)
    if (!fieldErrors) return false
    let first: keyof ProductFormValues | null = null
    for (const [apiField, message] of Object.entries(fieldErrors)) {
      const formField = API_TO_FORM_FIELD[apiField]
      if (!formField) continue
      form.setError(formField, { type: 'server', message })
      first ??= formField
    }
    if (first) form.setFocus(first)
    return true
  }

  return { form, applyApiErrors }
}
