'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useState } from 'react'
import { MoreIcon } from '@/components/ui/Icons'
import { splitBottomNavItems, type NavItem } from '@/lib/navigation'

interface BottomNavProps {
  items: (NavItem & { active: boolean })[]
}

// Abaixo de md: barra flutuante no rodapé (padrão "Celular" do protótipo).
// ADMIN vê até 7 itens — não cabem lado a lado sem apertar o alvo de toque,
// então o excedente vira um item "Mais" que abre uma folha com o resto.
export function BottomNav({ items }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const { primary, overflow } = splitBottomNavItems(items)
  const overflowActive = overflow.some((item) => item.active)

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-4 bottom-4 z-10 flex h-16 items-center justify-center gap-9 rounded-nav bg-surface px-2 shadow-nav md:hidden"
      >
        {primary.map(({ key, href, label, icon: Icon, active }) => (
          <Link
            key={key}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex h-12 w-12 items-center justify-center rounded-frame ${active ? 'bg-primary text-primary-ink' : 'text-ink'}`}
          >
            <Icon aria-hidden className="h-6 w-6" />
          </Link>
        ))}
        {overflow.length > 0 && (
          <button
            type="button"
            aria-label="Mais opções"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={`flex h-12 w-12 items-center justify-center rounded-frame ${overflowActive ? 'bg-primary text-primary-ink' : 'text-ink'}`}
          >
            <MoreIcon aria-hidden className="h-6 w-6" />
          </button>
        )}
      </nav>

      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40 backdrop-blur-sm md:hidden" />
          <Dialog.Content className="fixed inset-x-4 bottom-24 z-30 flex flex-col gap-1 rounded-nav bg-surface p-3 shadow-nav md:hidden">
            <Dialog.Title className="px-2 py-1 font-body text-xs font-semibold text-ink/50">Mais opções</Dialog.Title>
            {overflow.map(({ key, href, label, icon: Icon, active }) => (
              <Dialog.Close asChild key={key}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-frame px-3 py-3 font-body text-sm ${active ? 'bg-primary font-bold text-primary-ink' : 'font-medium text-ink'}`}
                >
                  <Icon aria-hidden />
                  {label}
                </Link>
              </Dialog.Close>
            ))}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
