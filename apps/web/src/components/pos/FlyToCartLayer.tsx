import type { CSSProperties } from 'react'
import type { CartFlight } from '@/hooks/use-fly-to-cart'

interface FlyToCartLayerProps {
  flights: CartFlight[]
}

// Camada fixa e transparente a clique: só desenha os pontinhos animados de
// FlyToCartLayer, sem interferir em nada abaixo.
export function FlyToCartLayer({ flights }: FlyToCartLayerProps) {
  return (
    <>
      {flights.map((flight) => {
        const fromX = flight.fromRect.left + flight.fromRect.width / 2
        const fromY = flight.fromRect.top + flight.fromRect.height / 2
        const toX = flight.toRect.left + flight.toRect.width / 2
        const toY = flight.toRect.top + flight.toRect.height / 2
        const style = {
          left: fromX - 6,
          top: fromY - 6,
          '--fly-dx': `${toX - fromX}px`,
          '--fly-dy': `${toY - fromY}px`,
        } as CSSProperties
        return (
          <span
            key={flight.id}
            aria-hidden
            className="pointer-events-none fixed z-40 h-3 w-3 rounded-full bg-primary [animation:fly-to-cart_0.45s_ease-in_forwards]"
            style={style}
          />
        )
      })}
    </>
  )
}
