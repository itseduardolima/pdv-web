import { useState } from 'react'
import {
  INITIAL_CALCULATOR_STATE,
  backspace,
  calculateResult,
  chooseOperator,
  clearAll,
  inputDecimal,
  inputDigit,
  type CalculatorOperator,
} from '@/lib/utils/calculator'

export function useCalculator() {
  const [state, setState] = useState(INITIAL_CALCULATOR_STATE)

  return {
    display: state.display,
    handleDigit: (digit: string) => setState((current) => inputDigit(current, digit)),
    handleDecimal: () => setState((current) => inputDecimal(current)),
    handleBackspace: () => setState((current) => backspace(current)),
    handleClear: () => setState(clearAll()),
    handleOperator: (operator: CalculatorOperator) => setState((current) => chooseOperator(current, operator)),
    handleEquals: () => setState((current) => calculateResult(current)),
  }
}
