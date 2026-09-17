import { useRouter } from 'next/navigation'
import { useCreatePlatformTenant } from '@/hooks/queries/use-create-platform-tenant'
import { formValuesToCreateInput, usePlatformTenantForm } from '@/hooks/use-platform-tenant-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { slugify } from '@/lib/utils/slugify'

export function useNewPlatformTenantPage() {
  const router = useRouter()
  const create = useCreatePlatformTenant()
  const { form, applyApiErrors } = usePlatformTenantForm()
  const save = useSaveState(create.isPending)

  // Preenche o identificador junto do nome, só enquanto o usuário não mexeu
  // nele à mão.
  function handleNameChange(value: string) {
    form.setValue('name', value, { shouldDirty: true })
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(value))
    }
  }

  // O administrador define o próprio PIN pelo link de primeiro acesso que
  // chega no e-mail informado aqui (PinTokenService, mesmo mecanismo do
  // operador comum) — o painel nunca pede/mostra PIN.
  const handleSubmit = form.handleSubmit((values) => {
    create.mutate(formValuesToCreateInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/platform/tenants')),
      onError: (error) => applyApiErrors(error),
    })
  })

  return {
    form,
    name: form.watch('name'),
    slug: form.watch('slug'),
    primaryColor: form.watch('primaryColor'),
    handleNameChange,
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(create.error),
    dismissError: create.reset,
  }
}
