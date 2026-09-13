// Ilustração do card "Mais vendidos hoje" (Dashboard) sem venda ainda —
// arquivo estático em public/, sem cor de marca. Maior que o padrão do
// EmptyState (ignora a altura recebida) pra não ficar minúscula nesse card.
export function EmptyTopProductsIllustration({ className = '' }: { className?: string }) {
  void className
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ilustração estática
    <img src="/top-products-illustration.svg" alt="" className="h-48 w-auto md:h-60" />
  )
}
