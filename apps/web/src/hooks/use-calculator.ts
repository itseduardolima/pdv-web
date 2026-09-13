import { useState } from 'react'
import {
  INITIAL_CALCULATOR_STATE,
  backspace,
  calculateResult,
  chooseOperator,
  clearAll,
  formatExpression,
  inputDecimal,
  inputDigit,
  type CalculatorOperator,
} from '@/lib/utils/calculator'

export function useCalculator() {
  const [state, setState] = useState(INITIAL_CALCULATOR_STATE)

  return {
    // Conta inteira, tudo num visor só (estilo iPhone: "8+2+2×3").
    display: formatExpression(state),
    handleDigit: (digit: string) => setState((current) => inputDigit(current, digit)),
    handleDecimal: () => setState((current) => inputDecimal(current)),
    handleBackspace: () => setState((current) => backspace(current)),
    handleClear: () => setState(clearAll()),
    handleOperator: (operator: CalculatorOperator) => setState((current) => chooseOperator(current, operator)),
    handleEquals: () => setState((current) => calculateResult(current)),
  }
}
