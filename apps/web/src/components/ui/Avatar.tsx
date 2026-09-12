import { initials } from '@/lib/utils/initials'

type Tone = 'accent' | 'warning' | 'danger'

const toneClass: Record<Tone, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

interface AvatarProps {
  name: string
  photoUrl: string | null
  tone?: Tone
  className?: string
}

export function Avatar({ name, photoUrl, tone = 'accent', className = '' }: AvatarProps) {
  const base = `flex h-14 w-14 items-center justify-center overflow-hidden rounded-pill font-body text-base font-bold text-surface ${className}`
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- foto vem do storage do tenant, domínio dinâmico
    return <img src={photoUrl} alt={name} className={`${base} object-cover`} />
  }
  return (
    <span aria-hidden className={`${base} ${toneClass[tone]}`}>
      {initials(name)}
    </span>
  )
}
