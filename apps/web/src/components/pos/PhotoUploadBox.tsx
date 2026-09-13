import { useId, useRef } from 'react'
import { CameraIcon } from '@/components/ui/Icons'
import { FieldError } from '@/components/ui/FieldError'

interface PhotoUploadBoxProps {
  value: string | null
  onChange: (file: File) => void
  label?: string
  uploading?: boolean
  error?: string
  // 'square' (padrão) pra foto de Produto; 'round' pra foto de Operador —
  // é rosto de gente, mostra como avatar (círculo), não retângulo
  // (2026-09-13). A caixa tracejada continua a mesma nos dois casos.
  variant?: 'square' | 'round'
}

// Mesma caixa tracejada para Produto e Operador (05-componentizacao).
export function PhotoUploadBox({
  value,
  onChange,
  label = 'Adicionar foto',
  uploading = false,
  error,
  variant = 'square',
}: PhotoUploadBoxProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-describedby={error ? errorId : undefined}
        className={`flex flex-col items-center justify-center gap-2 overflow-hidden border-2 border-dashed text-ink/40 disabled:opacity-60 ${value ? '' : 'bg-canvas'} ${error ? 'border-danger' : 'border-border'} ${
          variant === 'round'
            ? 'h-[104px] w-[104px] rounded-pill md:h-[144px] md:w-[144px]'
            : 'h-[140px] w-full rounded-card-sm md:h-[200px]'
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto no storage do tenant
          <img
            src={value}
            alt=""
            className={variant === 'round' ? 'h-full w-full rounded-pill object-cover' : 'h-full w-full object-contain'}
          />
        ) : (
          <>
            <CameraIcon aria-hidden />
            <span
              className={`font-body font-medium ${variant === 'round' ? 'text-center text-[11px] leading-tight' : 'text-[13px]'}`}
            >
              {uploading ? 'Enviando...' : label}
            </span>
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
