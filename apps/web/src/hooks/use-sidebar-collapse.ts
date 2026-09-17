'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pdv:sidebar-collapsed'
// Mesmo corte de "é desktop de verdade" usado no Sidebar/SplitAuthLayout
// (decisão de 2026-09-13): abaixo disso é tablet.
const DESKTOP_QUERY = '(min-width: 1280px)'

// Desktop (xl+) começa expandida; tablet (md..xl) começa fechada — decisão
// de 2026-09-17. Depois que o operador alterna manualmente, a escolha
// persiste (localStorage) e vale pra próxima visita, independente do
// tamanho de tela.
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    setCollapsed(stored === null ? !window.matchMedia(DESKTOP_QUERY).matches : stored === '1')
  }, [])

  function toggle() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return { collapsed, toggle }
}
