import Link from 'next/link'
import type { NavItem } from '@/lib/navigation'

interface BottomNavProps {
  items: (NavItem & { active: boolean })[]
}

// Abaixo de md: barra flutuante no rodapé (padrão "Celular" do protótipo).
export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-4 bottom-4 z-10 flex h-16 items-center justify-around rounded-nav bg-surface px-2 shadow-nav md:hidden"
    >
      {items.map(({ key, href, label, icon: Icon, active }) => (
        <Link
          key={key}
          href={href}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={`flex h-11 w-11 items-center justify-center rounded-frame ${active ? 'bg-primary text-primary-ink' : 'text-ink'}`}
        >
          <Icon aria-hidden />
        </Link>
      ))}
    </nav>
  )
}
