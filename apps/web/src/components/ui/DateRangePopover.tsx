'use client'

import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'
import { BackIcon } from './Icons'
import { addMonths, dayKeyFromDate, monthGrid, monthLabel } from '@/lib/utils/calendar'
import { parseDayKey } from '@/lib/utils/format-date'

interface DateRangePopoverProps {
  label: string
  active: boolean
  // Intervalo já aplicado (se houver) — só usado pra abrir o calendário já
  // no mês certo e pré-marcar a seleção; nunca muda sozinho.
  value: { from: string | null; to: string | null }
  onApply: (from: string, to: string) => void
  // 'single' (Histórico de Vendas): primeiro clique já escolhe o dia e
  // habilita "Aplicar" — sem esperar um segundo clique pra fechar o
  // intervalo. Default 'range' mantém o comportamento de sempre.
  mode?: 'range' | 'single'
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function formatShort(dayKey: string): string {
  return parseDayKey(dayKey).toLocaleDateString('pt-BR')
}

// HU 12.1: calendário próprio (não usa <input type="date"> nativo — o
// seletor do navegador não segue o design system e varia por SO/browser).
// Selecionar dois dias monta o intervalo; só "Aplicar" propaga pra fora —
// enquanto o usuário está escolhendo, o relatório do período anterior
// continua na tela (decisão de 2026-09-14).
export function DateRangePopover({ label, active, value, onApply, mode = 'range' }: DateRangePopoverProps) {
  const today = new Date()
  const initial = value.from ? parseDayKey(value.from) : today
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const [draftFrom, setDraftFrom] = useState<string | null>(value.from)
  const [draftTo, setDraftTo] = useState<string | null>(value.to)

  const grid = monthGrid(cursor.year, cursor.month)
  const todayKey = dayKeyFromDate(today)

  function handlePick(dayKey: string) {
    if (mode === 'single') {
      setDraftFrom(dayKey)
      setDraftTo(dayKey)
      return
    }
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(dayKey)
      setDraftTo(null)
      return
    }
    if (dayKey < draftFrom) {
      setDraftTo(draftFrom)
      setDraftFrom(dayKey)
    } else {
      setDraftTo(dayKey)
    }
  }

  function handleOpenChange(open: boolean) {
    // Reabrir sempre parte da última seleção aplicada, não do rascunho
    // largado pela metade da vez anterior.
    if (open) {
      setDraftFrom(value.from)
      setDraftTo(value.to)
    }
  }

  return (
    <Popover.Root onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-pressed={active}
          className={`rounded-pill border-[1.5px] border-ink px-4 py-2 font-body text-xs font-semibold md:text-[13px] ${
            active ? 'bg-primary text-primary-ink' : 'bg-surface text-ink'
          }`}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-20 w-[300px] rounded-card-sm border border-border bg-surface p-4 shadow-nav"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setCursor((c) => addMonths(c.year, c.month, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-pill text-ink hover:bg-canvas"
            >
              <BackIcon aria-hidden width="16" height="16" />
            </button>
            <span className="font-body text-[13px] font-semibold">{monthLabel(cursor.year, cursor.month)}</span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setCursor((c) => addMonths(c.year, c.month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-pill text-ink hover:bg-canvas"
            >
              <BackIcon aria-hidden width="16" height="16" className="rotate-180" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center font-body text-[11px] text-ink/40">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: grid.leadingBlanks }, (_, i) => (
              <span key={i} />
            ))}
            {grid.days.map((dayKey) => {
              const day = Number(dayKey.slice(-2))
              const isFrom = dayKey === draftFrom
              const isTo = dayKey === draftTo
              const inRange = draftFrom && draftTo && dayKey > draftFrom && dayKey < draftTo
              const isToday = dayKey === todayKey
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => handlePick(dayKey)}
                  className={`flex h-8 w-8 items-center justify-center rounded-pill font-body text-xs ${
                    isFrom || isTo
                      ? 'bg-primary font-bold text-primary-ink'
                      : inRange
                        ? 'bg-primary/15 text-ink'
                        : isToday
                          ? 'font-semibold text-ink underline'
                          : 'text-ink hover:bg-canvas'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 font-body text-xs text-ink/60">
            {mode === 'single' ? (
              <span className="w-full text-center">{draftFrom ? formatShort(draftFrom) : 'Escolha um dia'}</span>
            ) : (
              <>
                <span>{draftFrom ? formatShort(draftFrom) : 'De'}</span>
                <span>—</span>
                <span>{draftTo ? formatShort(draftTo) : 'Até'}</span>
              </>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Popover.Close asChild>
              <button
                type="button"
                className="flex-1 rounded-pill border-[1.5px] border-ink bg-surface px-4 py-2 font-body text-xs font-semibold text-ink"
              >
                Cancelar
              </button>
            </Popover.Close>
            <Popover.Close asChild>
              <button
                type="button"
                disabled={!draftFrom || !draftTo}
                onClick={() => draftFrom && draftTo && onApply(draftFrom, draftTo)}
                className="flex-1 rounded-pill bg-primary px-4 py-2 font-body text-xs font-semibold text-primary-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aplicar
              </button>
            </Popover.Close>
          </div>
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
