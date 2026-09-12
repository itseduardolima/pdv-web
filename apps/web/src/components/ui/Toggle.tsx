interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

// Interruptor em pílula (DESIGN_SYSTEM § Do's): mesmo `role="switch"` do
// protótipo; o rótulo fica para leitor de tela, a cor diz o estado.
export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-border'}`}
    >
      <span
        aria-hidden
        className={`absolute top-1 h-5 w-5 rounded-pill bg-surface shadow-sm transition-transform ${checked ? 'left-1 translate-x-5' : 'left-1'}`}
      />
    </button>
  )
}
