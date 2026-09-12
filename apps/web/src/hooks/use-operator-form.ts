import { useForm } from 'react-hook-form'
import type { CreateOperatorRequest, Operator, OperatorRole, UpdateOperatorRequest } from '@pdv/shared'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

// Valores como o usuário digita. O PIN só existe na criação; na edição ele
// é trocado por uma ação separada (HU 6.3).
export interface OperatorFormValues {
  name: string
  role: OperatorRole
  pin: string
  photoUrl: string | null
}

export const emptyOperatorFormValues: OperatorFormValues = { name: '', role: 'OPERATOR', pin: '', photoUrl: null }

export function operatorToFormValues(operator: Operator): OperatorFormValues {
  return { name: operator.name, role: operator.role, pin: '', photoUrl: operator.photoUrl }
}

export function formValuesToCreateInput(values: OperatorFormValues): CreateOperatorRequest {
  return { name: values.name, role: values.role, pin: values.pin, photoUrl: values.photoUrl }
}

export function formValuesToUpdateInput(values: OperatorFormValues): UpdateOperatorRequest {
  return { name: values.name, role: values.role, photoUrl: values.photoUrl }
}

// Mesmo padrão de useProductForm: RHF sem resolver, erros de campo vêm da API.
export function useOperatorForm(defaultValues: OperatorFormValues = emptyOperatorFormValues) {
  const form = useForm<OperatorFormValues>({ defaultValues })

  function applyApiErrors(error: unknown): boolean {
    const fieldErrors = apiFieldErrors(error)
    if (!fieldErrors) return false
    let first: keyof OperatorFormValues | null = null
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (!isFormField(field)) continue
      form.setError(field, { type: 'server', message })
      first ??= field
    }
    if (first) form.setFocus(first)
    return true
  }

  return { form, applyApiErrors }
}

function isFormField(field: string): field is keyof OperatorFormValues {
  return field in emptyOperatorFormValues
}
