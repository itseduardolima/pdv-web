'use client'

import { useCallback, useState } from 'react'

export interface CartFlight {
  id: number
  fromRect: DOMRect
  toRect: DOMRect
}

const FLIGHT_DURATION_MS = 450

let nextFlightId = 0

// Anima um pontinho voando do produto tocado até o badge do carrinho —
// feedback visual de "isso foi adicionado", sem depender de lib de animação.
export function useFlyToCart() {
  const [flights, setFlights] = useState<CartFlight[]>([])

  const fly = useCallback((fromRect: DOMRect, toRect: DOMRect) => {
    const id = nextFlightId++
    setFlights((current) => [...current, { id, fromRect, toRect }])
    window.setTimeout(() => {
      setFlights((current) => current.filter((flight) => flight.id !== id))
    }, FLIGHT_DURATION_MS)
  }, [])

  return { flights, fly }
}
