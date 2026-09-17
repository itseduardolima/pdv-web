import { EyeIcon, EyeOffIcon } from './Icons'

export function PasswordVisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Ocultar senha' : 'Exibir senha'}
      className="text-ink/40 hover:text-ink/60"
    >
      {visible ? <EyeOffIcon aria-hidden /> : <EyeIcon aria-hidden />}
    </button>
  )
}
