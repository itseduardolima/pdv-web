'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { Button, type ButtonState } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  confirmState?: ButtonState
  destructive?: boolean
}

// Confirmação de ação irreversível (Radix Dialog: foco, teclado e aria).
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, confirmState = 'idle', destructive }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-30 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-card bg-surface p-6 md:p-8">
          <Dialog.Title className="font-heading text-xl font-bold tracking-tight">{title}</Dialog.Title>
          {description && <Dialog.Description className="font-body text-sm text-ink/60">{description}</Dialog.Description>}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              onClick={onConfirm}
              state={confirmState}
              className={destructive ? '!bg-danger !text-surface' : ''}
            >
              {confirmLabel}
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancelar</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
