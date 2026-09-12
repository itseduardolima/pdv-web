import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useCart } from '@/hooks/use-cart'

export function useSaleConfirmedPage() {
  const router = useRouter()
  const { lastSale } = useCart()

  // Sem venda recém-feita (ex.: recarregou a página) não há o que confirmar.
  useEffect(() => {
    if (!lastSale) router.replace('/sell')
  }, [lastSale, router])

  return { sale: lastSale, handleNewSale: () => router.push('/sell') }
}
