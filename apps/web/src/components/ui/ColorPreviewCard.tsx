import { contrastInkColor } from '@/lib/utils/contrast-ink-color'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

// HU 11.5: prévia ao vivo, só CSS local — não chama a API. Mostra a cor
// primária escolhida do jeito que ela aparece no app (botão + destaque).
export function ColorPreviewCard({ primaryColor }: { primaryColor: string }) {
  const valid = HEX_RE.test(primaryColor)
  const background = valid ? primaryColor : '#e6e51e'
  const ink = contrastInkColor(background)

  return (
    <div className="flex flex-col gap-3 rounded-card-sm border border-border p-4">
      <p className="font-body text-xs font-semibold text-ink/60">Prévia</p>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center justify-center rounded-pill px-6 py-3 font-body text-sm font-medium"
          style={{ backgroundColor: background, color: ink }}
        >
          Botão de exemplo
        </span>
      </div>
    </div>
  )
}
