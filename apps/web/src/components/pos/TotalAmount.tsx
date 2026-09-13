import { formatCurrency } from '@/lib/utils/format-currency'

interface TotalAmountProps {
  cents: number
}

// "R$ 612,40" -> "R$" e ",40" na cor herdada (branco no TotalCard), só a
// parte inteira ("612") na cor primária da loja — mesmo destaque do
// protótipo. Sem casar o formato (ex.: moeda sem vírgula), cai pro texto
// simples inteiro, sem quebrar a tela.
export function TotalAmount({ cents }: TotalAmountProps) {
  const formatted = formatCurrency(cents)
  const match = /^(\D*)([\d.]+)([,.]\d{2})$/.exec(formatted)
  if (!match) return <>{formatted}</>

  const [, symbol, integer, decimals] = match
  return (
    <>
      {symbol}
      <span className="text-primary">{integer}</span>
      {decimals}
    </>
  )
}
