import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { CreateSaleInput, Product } from '@pdv/shared'
import { useAdjustStock } from '@/hooks/queries/use-adjust-stock'
import { useCreateSale } from '@/hooks/queries/use-create-sale'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { useCurrentCashSession } from '@/hooks/queries/use-current-cash-session'
import { useProducts } from '@/hooks/queries/use-products'
import { useCart } from '@/hooks/use-cart'
import { useSession } from '@/hooks/use-session'
import { useTenant } from '@/hooks/use-tenant'
import { apiErrorMessage, apiGeneralErrorMessage } from '@/lib/utils/api-error-message'
import { apiFieldErrors } from '@/lib/utils/api-field-errors'
import { matchesProductSearch } from '@/lib/utils/cart'
import { ApiClientError } from '@/lib/api-client'
import { getOfflineDb } from '@/lib/offline/db'
import { buildLocalSale } from '@/lib/offline/local-sale'
import { queuePendingSale } from '@/lib/offline/pending-sales'
import { isBackendUnreachable } from '@/lib/offline/products-cache'
import { syncPendingSales } from '@/lib/offline/sync'

export function useSellPage() {
  const router = useRouter()
  const tenant = useTenant()
  const queryClient = useQueryClient()
  const { operator } = useSession()
  const cashSession = useCurrentCashSession()
  const products = useProducts()
  const categories = useProductCategories()
  const cart = useCart()
  const createSale = useCreateSale()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [adjustingStock, setAdjustingStock] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)

  // Categoria e busca já filtram o mesmo grid em memória (a lista inteira
  // já está carregada para o leitor de código de barras funcionar).
  const visibleProducts = useMemo(
    () =>
      (products.data ?? []).filter(
        (product) => matchesProductSearch(product, search) && (category === null || product.category === category),
      ),
    [products.data, search, category],
  )

  // Achou por código de barras exato (Enter no leitor, ou clique direto no
  // resultado depois de digitar o código): a busca não serve mais pra nada
  // depois disso, limpa pro próximo. Achou por nome, mantém — o operador
  // costuma clicar em mais de um item da mesma busca (2026-09-13).
  function handleAdd(product: Product) {
    createSale.reset()
    cart.add({ productId: product.id, name: product.name, unit: product.unit, unitPriceCents: product.salePriceCents })
    if (search.trim() !== '' && product.barcode === search.trim()) setSearch('')
  }

  // Leitor de código de barras "digita" o código e manda Enter: adiciona o
  // produto exato (handleAdd já limpa a busca por ser código de barras).
  function handleSearchSubmit() {
    const exact = (products.data ?? []).find((product) => product.barcode === search.trim())
    if (exact) handleAdd(exact)
  }

  function handleAmountReceivedChange(text: string) {
    createSale.reset()
    cart.setAmountReceivedText(text)
  }

  // Sempre envia: a API decide (caixa aberto, estoque, forma de pagamento,
  // troco). O valor recebido só vai em Dinheiro e só se foi digitado.
  function handleCheckout() {
    const sendsReceived = cart.paymentMethod === 'CASH' && cart.amountReceivedText.trim() !== ''
    const input: CreateSaleInput = {
      uuid: cart.saleUuid,
      paymentMethod: cart.paymentMethod ?? ('' as never),
      ...(sendsReceived ? { amountReceivedCents: cart.amountReceivedCents } : {}),
      items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }
    createSale.mutate(input, {
      onSuccess: (sale) => {
        cart.finish(sale)
        router.push('/sell/confirmed')
      },
      // HU 8.2: sem rede ou API fora do ar, a venda não se perde — vai pra
      // fila local e a UI segue como se tivesse dado certo (a API é a fonte
      // da verdade final quando sincronizar). Erro de regra (sem estoque,
      // caixa fechado etc.) não cai aqui, continua aparecendo na tela.
      onError: (error) => {
        if (!isBackendUnreachable(error)) return
        const db = getOfflineDb(tenant.id)
        void queuePendingSale(db, input).then(() => {
          cart.finish(
            buildLocalSale({
              uuid: input.uuid,
              items: cart.items,
              paymentMethod: cart.paymentMethod as NonNullable<typeof cart.paymentMethod>,
              amountReceivedCents: sendsReceived ? cart.amountReceivedCents : null,
              changeCents: sendsReceived ? cart.changeCents : null,
              totalCents: cart.totalCents,
              cashSessionId: cashSession.data?.id ?? 'offline',
              operatorId: operator.id,
              operatorName: operator.name,
            }),
          )
          router.push('/sell/confirmed')
          void syncPendingSales(db, tenant.id).then(() => {
            void queryClient.invalidateQueries({ queryKey: ['products'] })
          })
        })
      },
    })
  }

  function handleCancel() {
    createSale.reset()
    cart.clear()
  }

  const fieldErrors = apiFieldErrors(createSale.error)
  const apiError = createSale.error instanceof ApiClientError ? createSale.error.error : null
  const details = apiError?.details as { productId?: string; available?: number } | undefined
  // INSUFFICIENT_CASH é erro do campo "Valor recebido", não do carrinho inteiro.
  const insufficientCash = apiError?.code === 'INSUFFICIENT_CASH' ? apiError.message : null
  // "Sem estoque" no meio da venda: atalho para o admin corrigir sem sair
  // da tela (03-regras-negocio § Venda). Operador não edita produto (ADMIN_ONLY).
  const insufficientStock =
    apiError?.code === 'INSUFFICIENT_STOCK' && details?.productId
      ? {
          productId: details.productId,
          available: details.available ?? 0,
          productName: cart.items.find((item) => item.productId === details.productId)?.name ?? '',
        }
      : null
  const adjustStock = useAdjustStock(insufficientStock?.productId ?? '')

  function handleAdjustStock(quantity: number) {
    adjustStock.mutate(quantity, {
      onSuccess: () => {
        setAdjustingStock(false)
        createSale.reset()
      },
    })
  }

  return {
    operator,
    cashSession: cashSession.data ?? null,
    search,
    setSearch,
    category,
    setCategory,
    categories: categories.data ?? [],
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
    insufficientStock,
    canAdjustStock: operator.role === 'ADMIN',
    adjustingStock,
    openAdjustStock: () => setAdjustingStock(true),
    closeAdjustStock: () => setAdjustingStock(false),
    handleAdjustStock,
    adjustStockState: adjustStock.isPending ? ('loading' as const) : ('idle' as const),
    adjustStockError: apiErrorMessage(adjustStock.error),
    calculatorOpen,
    openCalculator: () => setCalculatorOpen(true),
    setCalculatorOpen,
  }
}
