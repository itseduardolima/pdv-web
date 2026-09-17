import { useForm } from 'react-hook-form'
import { PRESET_COLORS } from '@/lib/colors'
import type { CreatePlatformTenantInput } from '@pdv/shared'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

export interface PlatformTenantFormValues {
  name: string
  slug: string
  primaryColor: string
  adminName: string
  adminEmail: string
  adminPin: string
}

export const emptyPlatformTenantFormValues: PlatformTenantFormValues = {
  name: '',
  slug: '',
  primaryColor: PRESET_COLORS[0]!,
  adminName: '',
  adminEmail: '',
  adminPin: '',
}

// "" em adminEmail vai como está: o schema da API trata vazio como ausente.
export function formValuesToCreateInput(values: PlatformTenantFormValues): CreatePlatformTenantInput {
  return {
    name: values.name,
    slug: values.slug,
    primaryColor: values.primaryColor,
    adminName: values.adminName,
    adminEmail: values.adminEmail,
    adminPin: values.adminPin,
  }
}

// Mesmo padrão de useOperatorForm: RHF sem resolver, erros de campo vêm da API.
export function usePlatformTenantForm() {
  const form = useForm<PlatformTenantFormValues>({ defaultValues: emptyPlatformTenantFormValues })

  function applyApiErrors(error: unknown): boolean {
    const fieldErrors = apiFieldErrors(error)
    if (!fieldErrors) return false
    let first: keyof PlatformTenantFormValues | null = null
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

function isFormField(field: string): field is keyof PlatformTenantFormValues {
  return field in emptyPlatformTenantFormValues
}
