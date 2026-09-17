import { useRouter } from 'next/navigation'
import { useCreatePlatformTenant } from '@/hooks/queries/use-create-platform-tenant'
import { formValuesToCreateInput, usePlatformTenantForm } from '@/hooks/use-platform-tenant-form'
import { usePinInput } from '@/hooks/use-pin-input'
import { useSaveState } from '@/hooks/use-save-state'
import { apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { slugify } from '@/lib/utils/slugify'

export function useNewPlatformTenantPage() {
  const router = useRouter()
  const create = useCreatePlatformTenant()
  const { form, applyApiErrors } = usePlatformTenantForm()
  const pinInput = usePinInput()
  const save = useSaveState(create.isPending)

  // Preenche o identificador junto do nome, só enquanto o usuário não mexeu
  // nele à mão.
  function handleNameChange(value: string) {
    form.setValue('name', value, { shouldDirty: true })
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(value))
    }
  }

  // O PIN usa o mesmo teclado numérico do Login (usePinInput), não um campo
  // do react-hook-form — por isso entra no payload por fora do "values" na
  // hora de montar a chamada, mas os erros de campo (adminPin) ainda batem
  // no form.formState.errors normalmente (setError funciona mesmo sem
  // register/Controller nesse campo). Só que, por não ser registrado, o
  // handleSubmit nunca limpa esse erro sozinho (só limpa campo com ref) —
  // sem isso a mensagem de um envio anterior ficava presa na tela mesmo
  // depois do usuário corrigir o PIN, parecendo que o novo envio não fez
  // nada. Por isso cada mudança no teclado limpa o erro manualmente.
  function clearPinError() {
    if (form.formState.errors.adminPin) form.clearErrors('adminPin')
  }
  function handlePinDigit(digit: string) {
    clearPinError()
    pinInput.append(digit)
  }
  function handlePinBackspace() {
    clearPinError()
    pinInput.backspace()
  }
  function handlePinClear() {
    clearPinError()
    pinInput.clear()
  }

  const handleSubmit = form.handleSubmit((values) => {
    create.mutate(formValuesToCreateInput({ ...values, adminPin: pinInput.pin }), {
      onSuccess: () => save.markSaved(() => router.push('/platform/tenants')),
      onError: (error) => {
        applyApiErrors(error)
        pinInput.clear()
      },
    })
  })

  return {
    form,
    name: form.watch('name'),
    slug: form.watch('slug'),
    primaryColor: form.watch('primaryColor'),
    handleNameChange,
    pin: pinInput.pin,
    onPinDigit: handlePinDigit,
    onPinBackspace: handlePinBackspace,
    onPinClear: handlePinClear,
    pinError: form.formState.errors.adminPin?.message,
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(create.error),
    dismissError: create.reset,
  }
}
