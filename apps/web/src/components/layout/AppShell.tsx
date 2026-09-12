'use client'

import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { useAppShell } from './use-app-shell'

// Decide sozinho o shell por breakpoint (05-componentizacao): sidebar (md+)
// ou bottom-nav (abaixo de md). As telas não sabem em qual estão.
export function AppShell({ children }: { children: ReactNode }) {
  const shell = useAppShell()
  return (
    <div className="flex min-h-screen gap-5 bg-canvas p-4 pb-24 md:h-screen md:p-[22px] md:pb-[22px]">
      <Sidebar
        tenant={shell.tenant}
        items={shell.items}
        operatorName={shell.operator.name}
        operatorPhotoUrl={shell.operator.photoUrl}
        roleLabel={shell.roleLabel}
        onLogout={shell.handleLogout}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-4 md:gap-[18px] md:overflow-y-auto">{children}</main>
      <BottomNav items={shell.items} />
    </div>
  )
}
