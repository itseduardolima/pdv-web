import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { Product } from '@pdv/shared'
import { useCreateSale } from '@/hooks/queries/use-create-sale'
import { useCurrentCashSession } from '@/hooks/queries/use-current-cash-session'
import { useProducts } from '@/hooks/queries/use-products'
import { useCart } from '@/hooks/use-cart'
import { useSession } from '@/hooks/use-session'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'
import { matchesProductSearch } from '@/lib/utils/cart'
import { ApiClientError } from '@/lib/api-client'

export function useSellPage() {
  const router = useRouter()
  const { operator } = useSession()
  const cashSession = useCurrentCashSession()
  const products = useProducts()
  const cart = useCart()
  const createSale = useCreateSale()
  const [search, setSearch] = useState('')

  const visibleProducts = useMemo(
    () => (products.data ?? []).filter((product) => matchesProductSearch(product, search)),
    [products.data, search],
  )

  function handleAdd(product: Product) {
    createSale.reset()
    cart.add({ productId: product.id, name: product.name, unit: product.unit, unitPriceCents: product.salePriceCents })
  }

  // Leitor de código de barras "digita" o código e manda Enter: adiciona o
  // produto exato e limpa a busca.
  function handleSearchSubmit() {
    const exact = (products.data ?? []).find((product) => product.barcode === search.trim())
    if (exact) {
      handleAdd(exact)
      setSearch('')
    }
  }

  function handleAmountReceivedChange(text: string) {
    createSale.reset()
    cart.setAmountReceivedText(text)
  }

  // Sempre envia: a API decide (caixa aberto, estoque, forma de pagamento,
  // troco). O valor recebido só vai em Dinheiro e só se foi digitado.
  function handleCheckout() {
    const sendsReceived = cart.paymentMethod === 'CASH' && cart.amountReceivedText.trim() !== ''
    createSale.mutate(
      {
        uuid: cart.saleUuid,
        paymentMethod: cart.paymentMethod ?? ('' as never),
        ...(sendsReceived ? { amountReceivedCents: cart.amountReceivedCents } : {}),
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      },
      {
        onSuccess: (sale) => {
          cart.finish(sale)
          router.push('/sell/confirmed')
        },
      },
    )
  }

  function handleCancel() {
    createSale.reset()
    cart.clear()
  }

  const fieldErrors = apiFieldErrors(createSale.error)
  const apiError = createSale.error instanceof ApiClientError ? createSale.error.error : null
  const details = apiError?.details as { productId?: string } | undefined
  // INSUFFICIENT_CASH é erro do campo "Valor recebido", não do carrinho inteiro.
  const insufficientCash = apiError?.code === 'INSUFFICIENT_CASH' ? apiError.message : null

  return {
    operator,
    cashSession: cashSession.data ?? null,
    search,
    setSearch,
    handleSearchSubmit,
    products: visibleProducts,
    isLoadingProducts: products.isPending,
    productsError: apiErrorMessage(products.error),
    cart,
    handleAdd,
    handleAmountReceivedChange,
    handleCheckout,
    handleCancel,
    isSubmitting: createSale.isPending,
    paymentMethodError: fieldErrors?.paymentMethod ?? null,
    itemsError: fieldErrors?.items ?? null,
    amountReceivedError: fieldErrors?.amountReceivedCents ?? insufficientCash,
    errorMessage: insufficientCash ? null : apiGeneralErrorMessage(createSale.error),
    highlightedProductId: details?.productId ?? null,
    dismissError: createSale.reset,
  }
}
