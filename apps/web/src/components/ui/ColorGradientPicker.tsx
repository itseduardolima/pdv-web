'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { hexToHsv, hsvToHex, isValidHex, type Hsv } from '@/lib/utils/color'

interface ColorGradientPickerProps {
  value: string
  onChange: (hex: string) => void
  label?: string
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const FALLBACK: Hsv = { h: 50, s: 0.87, v: 0.9 } // tom do amarelo padrão da plataforma

// Seletor de arrastar (matiz + saturação/brilho): pra quem prefere ajustar o
// tom visualmente a digitar hex ou abrir o picker do sistema (HU 11.3).
export function ColorGradientPicker({
  value,
  onChange,
  label = 'Ou ajuste o tom arrastando',
}: ColorGradientPickerProps) {
  const [hsv, setHsv] = useState<Hsv>(() => (isValidHex(value) ? hexToHsv(value) : FALLBACK))
  const lastEmitted = useRef(value)

  // Resincroniza só quando o hex mudou por fora (hex digitado, preset
  // clicado) — nunca a partir do nosso próprio onChange, senão o matiz
  // "escorrega" toda vez que a saturação/brilho passa perto de 0.
  useEffect(() => {
    if (value !== lastEmitted.current && isValidHex(value)) {
      setHsv(hexToHsv(value))
      lastEmitted.current = value
    }
  }, [value])

  function emit(next: Hsv) {
    setHsv(next)
    const hex = hsvToHex(next)
    lastEmitted.current = hex
    onChange(hex)
  }

  function updateFromSquare(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const s = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1)
    emit({ ...hsv, s, v })
  }

  function updateFromHue(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const h = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360
    emit({ ...hsv, h })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-xs text-ink/50">{label}</p>

      <div
        role="slider"
        aria-label="Saturação e brilho da cor"
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updateFromSquare(event)
        }}
        onPointerMove={(event) => event.buttons === 1 && updateFromSquare(event)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02
          if (event.key === 'ArrowRight') emit({ ...hsv, s: clamp(hsv.s + step, 0, 1) })
          else if (event.key === 'ArrowLeft') emit({ ...hsv, s: clamp(hsv.s - step, 0, 1) })
          else if (event.key === 'ArrowUp') emit({ ...hsv, v: clamp(hsv.v + step, 0, 1) })
          else if (event.key === 'ArrowDown') emit({ ...hsv, v: clamp(hsv.v - step, 0, 1) })
          else return
          event.preventDefault()
        }}
        className="relative h-36 w-full max-w-[280px] cursor-crosshair touch-none select-none rounded-card-sm outline-none focus-visible:ring-2 focus-visible:ring-ink"
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvToHex(hsv) }}
        />
      </div>

      <div
        role="slider"
        aria-label="Matiz da cor"
        aria-valuenow={Math.round(hsv.h)}
        aria-valuemin={0}
        aria-valuemax={360}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updateFromHue(event)
        }}
        onPointerMove={(event) => event.buttons === 1 && updateFromHue(event)}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 2
          if (event.key === 'ArrowRight') emit({ ...hsv, h: clamp(hsv.h + step, 0, 360) })
          else if (event.key === 'ArrowLeft') emit({ ...hsv, h: clamp(hsv.h - step, 0, 360) })
          else return
          event.preventDefault()
        }}
        className="relative h-3 w-full max-w-[280px] cursor-pointer touch-none select-none rounded-pill outline-none focus-visible:ring-2 focus-visible:ring-ink"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ left: `${(hsv.h / 360) * 100}%` }}
        />
      </div>
    </div>
  )
}
