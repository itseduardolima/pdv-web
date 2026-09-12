import { PIN_LENGTH } from '@/hooks/use-pin-input'

interface PinKeypadProps {
  pin: string
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
  disabled?: boolean
}

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const keyClass = 'flex h-14 items-center justify-center rounded-input font-heading text-lg font-bold text-ink disabled:opacity-60'

export function PinKeypad({ pin, onDigit, onBackspace, onClear, disabled = false }: PinKeypadProps) {
  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-4">
      <p className="font-body text-sm font-medium text-ink/50">Digite seu PIN</p>
      <div className="flex gap-3" aria-label={`${pin.length} de ${PIN_LENGTH} dígitos`} data-cy="pin-dots">
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <span
            key={index}
            data-filled={index < pin.length}
            className={`h-[15px] w-[15px] rounded-pill border-2 border-ink ${index < pin.length ? 'bg-ink' : ''}`}
          />
        ))}
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        {digits.map((digit) => (
          <button key={digit} type="button" disabled={disabled} onClick={() => onDigit(digit)} className={`${keyClass} bg-canvas sm:bg-canvas`}>
            {digit}
          </button>
        ))}
        <button type="button" disabled={disabled} onClick={onClear} className={`${keyClass} font-body text-sm font-medium text-ink/40`}>
          Limpar
        </button>
        <button type="button" disabled={disabled} onClick={() => onDigit('0')} className={`${keyClass} bg-canvas`}>
          0
        </button>
        <button type="button" disabled={disabled} onClick={onBackspace} aria-label="Apagar" className={`${keyClass} text-ink/40`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6H9l-6 6 6 6h11a2 2 0 002-2V8a2 2 0 00-2-2z" />
            <line x1="14" y1="10" x2="18" y2="14" />
            <line x1="18" y1="10" x2="14" y2="14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
