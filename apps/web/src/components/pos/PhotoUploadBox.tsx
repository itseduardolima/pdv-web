import { useId, useRef } from 'react'
import { CameraIcon } from '@/components/ui/Icons'
import { FieldError } from '@/components/ui/FieldError'

interface PhotoUploadBoxProps {
  value: string | null
  onChange: (file: File) => void
  label?: string
  uploading?: boolean
  error?: string
  // Ocupa toda a altura do pai (card lado a lado com um formulário mais alto).
  fill?: boolean
}

// Mesma caixa tracejada para Produto e Operador (05-componentizacao).
export function PhotoUploadBox({
  value,
  onChange,
  label = 'Adicionar foto',
  uploading = false,
  error,
  fill = false,
}: PhotoUploadBoxProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`flex flex-col gap-1.5 ${fill ? 'h-full' : ''}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-describedby={error ? errorId : undefined}
        className={`flex w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-card-sm border-2 border-dashed bg-canvas text-ink/40 disabled:opacity-60 ${fill ? 'min-h-[140px] flex-1 md:min-h-[200px]' : 'h-[140px] md:h-[200px]'} ${error ? 'border-danger' : 'border-border'}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <>
            <CameraIcon aria-hidden />
            <span className="font-body text-[13px] font-medium">{uploading ? 'Enviando...' : label}</span>
          </>
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-center font-body text-xs font-medium text-accent"
        >
          Trocar foto
        </button>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        data-cy="photo-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChange(file)
          event.target.value = ''
        }}
      />
      <FieldError id={errorId} message={error} />
    </div>
  )
}
