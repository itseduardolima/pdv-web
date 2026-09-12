import { redirect } from 'next/navigation'

// Com caixa aberto, a tela inicial é Vender.
export default function HomePage() {
  redirect('/sell')
}
