import { useForm } from 'react-hook-form'
import type { PublicTenant, UpdateTenantInput } from '@pdv/shared'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

// HU 11.1-11.4: nome, logo, cores e fuso horário são editáveis;
// primaryInkColor nunca entra aqui — é calculado pelo backend.
export interface TenantSettingsFormValues {
  name: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  timezone: string
  // HU 11.6: quantidade de caixas físicos (Épico 4, 4.5-4.7).
  registerCount: number
}

export function tenantToFormValues(tenant: PublicTenant): TenantSettingsFormValues {
  return {
    name: tenant.name,
    logoUrl: tenant.logoUrl,
    primaryColor: tenant.primaryColor,
    accentColor: tenant.accentColor,
    timezone: tenant.timezone,
    registerCount: tenant.registerCount,
  }
}

export function formValuesToUpdateInput(values: TenantSettingsFormValues): UpdateTenantInput {
  return {
    name: values.name,
    logoUrl: values.logoUrl,
    primaryColor: values.primaryColor,
    accentColor: values.accentColor,
    timezone: values.timezone,
    registerCount: values.registerCount,
  }
}

// Mesmo padrão de useOperatorForm: RHF sem resolver, erros de campo vêm da API.
export function useTenantSettingsForm(defaultValues: TenantSettingsFormValues) {
  const form = useForm<TenantSettingsFormValues>({ defaultValues })

  function applyApiErrors(error: unknown): boolean {
    const fieldErrors = apiFieldErrors(error)
    if (!fieldErrors) return false
    let first: keyof TenantSettingsFormValues | null = null
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

function isFormField(field: string): field is keyof TenantSettingsFormValues {
  return (
    field === 'name' ||
    field === 'logoUrl' ||
    field === 'primaryColor' ||
    field === 'accentColor' ||
    field === 'timezone' ||
    field === 'registerCount'
  )
}
