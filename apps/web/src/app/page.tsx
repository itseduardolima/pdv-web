export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-card bg-surface p-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">PDV</h1>
        <p className="mt-2 text-sm text-ink/60">Base do projeto pronta. Próximo passo: módulo de tenant.</p>
        <button type="button" className="mt-6 rounded-pill bg-primary px-8 py-4 font-medium text-primary-ink">
          Botão primário
        </button>
      </div>
    </main>
  )
}
