'use client'

import { useEffect, useState } from 'react'

// SSR-safe: começa `false` (layout mobile-first) e corrige no mount; ao
// vivo, reage a redimensionar a janela (não só o valor inicial).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}
