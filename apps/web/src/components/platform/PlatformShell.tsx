'use client'

import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { usePlatformShell } from './use-platform-shell'

// Mesmo shell (Sidebar md+ / BottomNav abaixo disso) do app da loja
// (components/layout/AppShell) — reaproveitado tal como é, só trocando de
// onde vêm os dados (usePlatformShell no lugar de useAppShell).
export function PlatformShell({ children }: { children: ReactNode }) {
  const shell = usePlatformShell()
  return (
    <div className="flex min-h-screen gap-5 bg-canvas p-4 pb-24 md:h-screen md:p-[22px] md:pb-[22px]">
      <Sidebar
        tenant={shell.tenant}
        items={shell.items}
        operatorName={shell.operatorName}
        operatorPhotoUrl={shell.operatorPhotoUrl}
        roleLabel={shell.roleLabel}
        onLogout={shell.handleLogout}
        collapsed={shell.sidebarCollapsed}
        onToggleCollapsed={shell.toggleSidebarCollapsed}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-4 md:gap-[18px] md:overflow-y-auto">{children}</main>
      <BottomNav items={shell.items} onLogout={shell.handleLogout} />
    </div>
  )
}
