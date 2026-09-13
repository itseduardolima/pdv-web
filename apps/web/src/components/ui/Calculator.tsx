import { useCalculator } from '@/hooks/use-calculator'
import { BackspaceIcon } from '@/components/ui/Icons'
import type { CalculatorOperator } from '@/lib/utils/calculator'

const keyClass =
  'flex h-12 items-center justify-center rounded-input bg-canvas font-heading text-lg font-bold text-ink md:h-14'

// Calculadora solta, sem ligação com carrinho/venda — só uma ferramenta de
// balcão pra ajudar a dividir a conta com o cliente (2026-09-13).
export function Calculator() {
  const calc = useCalculator()

  return (
    <div className="flex flex-col gap-3">
      {/* Conta inteira num visor só, estilo iPhone ("8+2+2×3") — pra
          contas longas o operador precisa ver tudo que já clicou, não
          só o número atual (2026-09-13). */}
      <output className="block w-full overflow-x-auto whitespace-nowrap rounded-input bg-canvas px-4 py-3 text-right font-heading text-3xl font-bold tabular-nums text-ink">
        {calc.display}
      </output>

      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={calc.handleClear} className={`${keyClass} text-danger`}>
          C
        </button>
        <button type="button" onClick={calc.handleBackspace} aria-label="Apagar" className={keyClass}>
          <BackspaceIcon aria-hidden width="18" height="18" />
        </button>
        <OperatorKey operator="÷" onClick={calc.handleOperator} />
        <OperatorKey operator="×" onClick={calc.handleOperator} />

        <DigitKey digit="7" onClick={calc.handleDigit} />
        <DigitKey digit="8" onClick={calc.handleDigit} />
        <DigitKey digit="9" onClick={calc.handleDigit} />
        <OperatorKey operator="-" onClick={calc.handleOperator} />

        <DigitKey digit="4" onClick={calc.handleDigit} />
        <DigitKey digit="5" onClick={calc.handleDigit} />
        <DigitKey digit="6" onClick={calc.handleDigit} />
        <OperatorKey operator="+" onClick={calc.handleOperator} />

        <DigitKey digit="1" onClick={calc.handleDigit} />
        <DigitKey digit="2" onClick={calc.handleDigit} />
        <DigitKey digit="3" onClick={calc.handleDigit} />
        <button
          type="button"
          onClick={calc.handleEquals}
          aria-label="Igual"
          className={`${keyClass} row-span-2 bg-primary text-primary-ink`}
        >
          =
        </button>

        <button type="button" onClick={() => calc.handleDigit('0')} className={`${keyClass} col-span-2`}>
          0
        </button>
        <button type="button" onClick={calc.handleDecimal} aria-label="Vírgula" className={keyClass}>
          ,
        </button>
      </div>
    </div>
  )
}

function DigitKey({ digit, onClick }: { digit: string; onClick: (digit: string) => void }) {
  return (
    <button type="button" onClick={() => onClick(digit)} className={keyClass}>
      {digit}
    </button>
  )
}

function OperatorKey({
  operator,
  onClick,
}: {
  operator: CalculatorOperator
  onClick: (operator: CalculatorOperator) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(operator)}
      aria-label={`Operador ${operator}`}
      className={`${keyClass} bg-ink text-surface`}
    >
      {operator}
    </button>
  )
}
