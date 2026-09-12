'use client'

import { Button } from '@/components/ui/Button'
import { useTenant } from '@/hooks/use-tenant'
import { useHomePage } from './use-home-page'

export default function HomePage() {
  const tenant = useTenant()
  const page = useHomePage()

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-card bg-surface p-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{tenant.name}</h1>
        <p className="mt-2 text-sm text-ink/60">Olá, {page.operator.name}. Próximo passo: abertura de caixa.</p>
        <Button variant="secondary" onClick={page.handleLogout} loading={page.isLoggingOut} className="mt-6">
          Sair
        </Button>
      </div>
    </main>
  )
}
