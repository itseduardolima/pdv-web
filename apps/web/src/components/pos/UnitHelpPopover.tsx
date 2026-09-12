'use client'

import * as Popover from '@radix-ui/react-popover'
import { PRODUCT_UNIT_INFO, productUnitSchema } from '@pdv/shared'
import { InfoIcon } from '@/components/ui/Icons'

// "Qual unidade escolher?" — explicação simples para quem não é do ramo.
export function UnitHelpPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 font-body text-xs font-medium text-accent"
          data-cy="unit-help"
        >
          <InfoIcon aria-hidden width="14" height="14" />
          Qual escolher?
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          className="z-20 w-[300px] rounded-card-sm border border-border bg-surface p-4 shadow-nav"
        >
          <p className="mb-2 font-heading text-sm font-bold">Como o produto é vendido?</p>
          <dl className="flex flex-col gap-2">
            {productUnitSchema.options.map((unit) => (
              <div key={unit}>
                <dt className="font-body text-[13px] font-semibold">{PRODUCT_UNIT_INFO[unit].label}</dt>
                <dd className="font-body text-xs text-ink/60">{PRODUCT_UNIT_INFO[unit].help}</dd>
              </div>
            ))}
          </dl>
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
