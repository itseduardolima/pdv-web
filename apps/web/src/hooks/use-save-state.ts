import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveState = 'idle' | 'loading' | 'success'
const SUCCESS_MS = 600

// Estado do botão de salvar (DESIGN_SYSTEM § Validação e feedback, item 3):
// loading enquanto a API responde; success por ~600ms antes de seguir.
export function useSaveState(isPending: boolean) {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const markSaved = useCallback((then: () => void) => {
    setSaved(true)
    timer.current = setTimeout(() => {
      setSaved(false)
      then()
    }, SUCCESS_MS)
  }, [])

  const state: SaveState = saved ? 'success' : isPending ? 'loading' : 'idle'
  return { state, markSaved }
}
