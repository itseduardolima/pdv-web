import { redirect } from 'next/navigation'

// Até a Abertura de Caixa existir (Sprint 3), a home é a lista de produtos.
export default function HomePage() {
  redirect('/products')
}
