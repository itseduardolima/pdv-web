'use client'

import { SplitAuthLayout } from '@/components/layout/SplitAuthLayout'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { InfoIcon, WalletIcon } from '@/components/ui/Icons'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { formatCurrency } from '@/lib/utils/format-currency'
import { formatDayAndTime } from '@/lib/utils/format-date'
import { OPENING_AMOUNT_SUGGESTIONS_CENTS, useOpenRegisterPage } from './use-open-register-page'

export default function OpenRegisterPage() {
  const page = useOpenRegisterPage()

  return (
    <SplitAuthLayout illustrationSrc="/login-illustration.png">
      <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-canvas text-ink">
        <WalletIcon aria-hidden />
      </span>
      <div className="text-center">
        <h1 className="font-heading text-[21px] font-bold tracking-tight md:text-[26px]">Abertura de Caixa</h1>
        <p className="mt-1 font-body text-xs text-ink/45 md:text-[13px]">{formatDayAndTime(page.now)}</p>
      </div>

      <div className="flex items-center gap-2.5 rounded-pill bg-canvas py-1.5 pl-1.5 pr-4">
        <Avatar name={page.operatorName} photoUrl={page.operatorPhotoUrl} className="!h-8 !w-8 !text-xs" />
        <span className="font-body text-[13px] font-semibold">{page.operatorName} vai abrir o caixa</span>
      </div>

      <hr className="w-full border-border" />

      <div className="flex w-full flex-col items-center gap-2">
        <label htmlFor="opening-amount" className="font-body text-[13px] font-medium text-ink/50">
          Valor inicial em dinheiro
        </label>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[22px] font-bold text-ink/40 md:text-[28px]">R$</span>
          <input
            id="opening-amount"
            inputMode="decimal"
            placeholder="0,00"
            value={page.amountText}
            onChange={(event) => page.handleAmountChange(event.target.value)}
            aria-invalid={page.amountError ? true : undefined}
            aria-describedby={page.amountError ? 'opening-amount-error' : undefined}
            className={`w-[200px] bg-transparent text-center font-heading text-[40px] font-bold tracking-tight outline-none placeholder:text-ink/20 md:text-[52px] ${page.amountError ? 'text-danger' : ''}`}
          />
        </div>
        <FieldError id="opening-amount-error" message={page.amountError ?? undefined} />
      </div>

      <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
        {OPENING_AMOUNT_SUGGESTIONS_CENTS.map((cents) => (
          <button
            key={cents}
            type="button"
            onClick={() => page.handleSuggestion(cents)}
            aria-pressed={page.selectedSuggestion === cents}
            className={`rounded-pill border-[1.5px] border-ink px-4 py-2 font-body text-xs font-semibold md:text-[13px] ${page.selectedSuggestion === cents ? 'bg-primary text-primary-ink' : 'bg-surface text-ink'}`}
          >
            {formatCurrency(cents).replace(',00', '')}
          </button>
        ))}
      </div>

      <div className="flex w-full items-center gap-2.5 rounded-input bg-canvas px-4 py-3 font-body text-xs text-ink/55">
        <InfoIcon aria-hidden className="shrink-0 text-accent" />
        Esse valor será usado como referência no fechamento de caixa
      </div>

      {page.errorMessage && <InlineAlert onDismiss={page.dismissError}>{page.errorMessage}</InlineAlert>}

      <Button onClick={page.handleSubmit} state={page.isSubmitting ? 'loading' : 'idle'} className="w-full">
        Abrir Caixa
      </Button>
    </SplitAuthLayout>
  )
}
