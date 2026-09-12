import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useDeleteOperator } from '@/hooks/queries/use-delete-operator'
import { useOperator } from '@/hooks/queries/use-operator'
import { useSendPinLink } from '@/hooks/queries/use-send-pin-link'
import { useSetOperatorPin } from '@/hooks/queries/use-set-operator-pin'
import { useUpdateOperator } from '@/hooks/queries/use-update-operator'
import { useUploadImage } from '@/hooks/queries/use-upload-image'
import { formValuesToUpdateInput, operatorToFormValues, useOperatorForm } from '@/hooks/use-operator-form'
import { useSaveState } from '@/hooks/use-save-state'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'

export function useEditOperatorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const operator = useOperator(id)
  const update = useUpdateOperator(id)
  const setPin = useSetOperatorPin(id)
  const sendLink = useSendPinLink(id)
  const linkSave = useSaveState(sendLink.isPending)
  const remove = useDeleteOperator(id)
  const upload = useUploadImage('operator')
  const { form, applyApiErrors } = useOperatorForm()
  const save = useSaveState(update.isPending)
  const pinSave = useSaveState(setPin.isPending)
  const [newPin, setNewPin] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (operator.data) form.reset(operatorToFormValues(operator.data))
  }, [operator.data, form])

  const handleSubmit = form.handleSubmit((values) => {
    update.mutate(formValuesToUpdateInput(values), {
      onSuccess: () => save.markSaved(() => router.push('/operators')),
      onError: (error) => applyApiErrors(error),
    })
  })

  // Resetar PIN (HU 6.3) é uma ação à parte: não passa pelo formulário.
  function handlePinChange(event: ChangeEvent<HTMLInputElement>) {
    setPin.reset()
    setNewPin(event.target.value.replace(/\D/g, ''))
  }
  function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPin.mutate({ pin: newPin }, { onSuccess: () => pinSave.markSaved(() => setNewPin('')) })
  }

  // Com e-mail, o admin reenvia o link em vez de digitar um PIN por alguém.
  function handleSendLink() {
    sendLink.mutate(undefined, { onSuccess: () => linkSave.markSaved(() => undefined) })
  }

  function handlePhotoChange(file: File) {
    upload.mutate(file, { onSuccess: (url) => form.setValue('photoUrl', url, { shouldDirty: true }) })
  }

  function handleDelete() {
    remove.mutate(undefined, {
      onSuccess: () => router.push('/operators'),
      onError: () => setConfirmingDelete(false),
    })
  }

  return {
    form,
    operatorName: operator.data?.name ?? '',
    operatorEmail: operator.data?.email ?? null,
    hasPin: operator.data?.hasPin ?? true,
    isLoading: operator.isPending,
    loadErrorMessage: apiErrorMessage(operator.error),
    handleSubmit,
    submitState: save.state,
    errorMessage: apiGeneralErrorMessage(update.error) ?? apiErrorMessage(remove.error),
    dismissError: () => {
      update.reset()
      remove.reset()
    },
    handlePhotoChange,
    photoUploading: upload.isPending,
    photoError: apiErrorMessage(upload.error),
    newPin,
    handlePinChange,
    handlePinSubmit,
    pinState: pinSave.state,
    pinError: apiFieldErrors(setPin.error)?.pin ?? apiGeneralErrorMessage(setPin.error),
    handleSendLink,
    linkState: linkSave.state,
    linkError: apiErrorMessage(sendLink.error),
    dismissLinkError: sendLink.reset,
    confirmingDelete,
    setConfirmingDelete,
    handleDelete,
    deleteState: remove.isPending ? ('loading' as const) : ('idle' as const),
  }
}
