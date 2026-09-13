'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { CartLine } from '@/components/pos/CartLine'
import { CashReceived } from '@/components/pos/CashReceived'
import { CategoryFilter } from '@/components/pos/CategoryFilter'
import { PaymentMethodPicker } from '@/components/pos/PaymentMethodPicker'
import { QuickStockAdjust } from '@/components/pos/QuickStockAdjust'
import { ProductTile } from '@/components/pos/ProductTile'
import { Button } from '@/components/ui/Button'
import { CalculatorDialog } from '@/components/ui/CalculatorDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { FieldError } from '@/components/ui/FieldError'
import { BarcodeIcon, SearchIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayLong, formatTime } from '@/lib/utils/format-date'
import { useSellPage } from './use-sell-page'

export default function SellPage() {
  const page = useSellPage()
  const openedAt = page.cashSession ? new Date(page.cashSession.openedAt) : null

  return (
    <>
      <PageHeader
        title="Vender"
        subtitle={
          openedAt ? `${formatDayLong(openedAt)} · Caixa aberto desde ${formatTime(openedAt)}` : 'Carregando...'
        }
        actions={
          page.cashSession && (
            <>
              <button
                type="button"
                onClick={page.openCalculator}
                aria-label="Abrir calculadora"
                title="Calculadora"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-canvas p-1.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático em /public */}
                <img src="/icons/calculator.svg" alt="" className="h-full w-full" />
              </button>
              <span className="rounded-pill bg-ink px-4 py-1.5 font-body text-[13px] font-medium text-surface">
                Caixa #{page.cashSession.sequence}
              </span>
            </>
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-[18px]">
        <section
          // Tablet (retrato em md, deitado em lg — antes do xl virar
          // desktop de verdade) encolhe o catálogo e dá mais espaço ao
          // carrinho; deitado encolhe mais ainda — decisão de 2026-09-13.
          className="flex min-w-0 flex-col gap-3.5 rounded-card bg-surface p-3 md:flex-[1] md:p-[18px] lg:flex-[1.4] xl:flex-[2.3]"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              page.handleSearchSubmit()
            }}
            className="flex h-12 items-center gap-2.5 rounded-input bg-canvas pl-4 pr-2 md:h-14"
          >
            <SearchIcon aria-hidden className="shrink-0 text-accent" />
            <input
              type="search"
              value={page.search}
              onChange={(event) => page.setSearch(event.target.value)}
              placeholder="Buscar produto ou digitar código de barras..."
              aria-label="Buscar produto ou código de barras"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink/40 md:text-[15px]"
            />
            <button
              type="submit"
              aria-label="Ler código de barras"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-frame bg-ink text-surface md:h-11 md:w-11"
            >
              <BarcodeIcon aria-hidden />
            </button>
          </form>

          {page.categories.length > 0 && (
            <CategoryFilter categories={page.categories} value={page.category} onChange={page.setCategory} />
          )}

          {page.productsError && <InlineAlert>{page.productsError}</InlineAlert>}

          <div
            // Abaixo de md a página inteira cresce com a tela (sem altura
            // travada), então "flex-1" sozinho não trava o grid — precisa de
            // um teto fixo pra rolar por dentro em vez de crescer com a
            // quantidade de produtos (decisão de 2026-09-13).
            className="flex max-h-[46vh] min-h-0 flex-1 flex-col overflow-y-auto rounded-input bg-canvas bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1.4px)] p-2.5 [background-size:18px_18px] md:max-h-none md:p-3.5"
          >
            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-2 md:gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {page.products.map((product) => (
                <ProductTile key={product.id} product={product} onAdd={page.handleAdd} />
              ))}
            </div>
            {!page.isLoadingProducts && page.products.length === 0 && (
              <EmptyState
                title={page.search || page.category ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                description={
                  page.search || page.category
                    ? 'Tente outro nome, categoria ou código de barras.'
                    : 'Cadastre produtos na tela Produtos.'
                }
              />
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-3.5 rounded-card bg-surface p-4 md:min-w-[280px] md:max-w-[480px] md:flex-1 md:p-[22px] lg:max-w-[420px] xl:max-w-[340px]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold tracking-tight md:text-xl">Carrinho</h2>
            <span className="rounded-pill bg-ink px-3 py-1 font-body text-[11px] font-medium text-surface md:text-xs">
              {page.cart.itemCount} {page.cart.itemCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {page.cart.items.length === 0 ? (
              <li className="flex flex-1">
                <EmptyState
                  size="sm"
                  illustration="cart"
                  title="Carrinho vazio"
                  description="Toque em um produto para adicionar."
                />
              </li>
            ) : (
              page.cart.items.map((item) => (
                <CartLine
                  key={item.productId}
                  item={item}
                  onIncrement={page.cart.increment}
                  onDecrement={page.cart.decrement}
                  highlighted={item.productId === page.highlightedProductId}
                />
              ))
            )}
          </ul>
          <FieldError id="cart-items-error" message={page.itemsError ?? undefined} />

          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-body text-[15px] font-medium">Total</span>
            <span className="font-heading text-[26px] font-bold tracking-tight md:text-[28px]">
              {formatCurrency(page.cart.totalCents)}
            </span>
          </div>

          <PaymentMethodPicker
            value={page.cart.paymentMethod}
            onChange={page.cart.setPaymentMethod}
            error={page.paymentMethodError ?? undefined}
          />

          {page.cart.paymentMethod === 'CASH' && (
            <CashReceived
              value={page.cart.amountReceivedText}
              onChange={page.handleAmountReceivedChange}
              changeCents={page.cart.changeCents}
              error={page.amountReceivedError ?? undefined}
            />
          )}

          {page.errorMessage && (
            <InlineAlert
              onDismiss={page.dismissError}
              action={
                page.insufficientStock && page.canAdjustStock && !page.adjustingStock
                  ? { label: 'Ajustar estoque', onClick: page.openAdjustStock }
                  : undefined
              }
            >
              {page.errorMessage}
            </InlineAlert>
          )}

          {page.adjustingStock && page.insufficientStock && (
            <QuickStockAdjust
              productName={page.insufficientStock.productName}
              initialQuantity={page.insufficientStock.available}
              onConfirm={page.handleAdjustStock}
              onCancel={page.closeAdjustStock}
              confirmState={page.adjustStockState}
              error={page.adjustStockError ?? undefined}
            />
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={page.handleCheckout} state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
              Finalizar Venda
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={page.handleCancel}
              disabled={page.cart.items.length === 0 || page.isSubmitting}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </aside>
      </div>

      <CalculatorDialog open={page.calculatorOpen} onOpenChange={page.setCalculatorOpen} />
    </>
  )
}
