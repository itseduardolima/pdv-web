import { useForm } from 'react-hook-form'
import type { CreateOperatorRequest, Operator, OperatorRole, UpdateOperatorRequest } from '@pdv/shared'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

// Valores como o usuário digita. O PIN só existe na criação (opcional se
// houver e-mail: o operador define pelo link); na edição o PIN é trocado
// por ação separada (HU 6.3).
export interface OperatorFormValues {
  name: string
  role: OperatorRole
  email: string
  pin: string
  photoUrl: string | null
}

export const emptyOperatorFormValues: OperatorFormValues = {
  name: '',
  role: 'OPERATOR',
  email: '',
  pin: '',
  photoUrl: null,
}

export function operatorToFormValues(operator: Operator): OperatorFormValues {
  return { name: operator.name, role: operator.role, email: operator.email ?? '', pin: '', photoUrl: operator.photoUrl }
}

// "" em e-mail/PIN vai como está: o schema da API trata vazio como ausente
// e aplica as regras (admin exige e-mail, sem e-mail exige PIN).
export function formValuesToCreateInput(values: OperatorFormValues): CreateOperatorRequest {
  return { name: values.name, role: values.role, email: values.email, pin: values.pin, photoUrl: values.photoUrl }
}

export function formValuesToUpdateInput(values: OperatorFormValues): UpdateOperatorRequest {
  return { name: values.name, role: values.role, email: values.email, photoUrl: values.photoUrl }
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
