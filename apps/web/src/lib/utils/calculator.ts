// Lógica pura de uma calculadora simples (dividir conta com cliente no
// balcão — 06 § Regras que não estão em nenhum spec: função pura fica em
// lib/utils). Sem ligação nenhuma com carrinho, venda ou API.

export type CalculatorOperator = '+' | '-' | '×' | '÷'

export interface CalculatorState {
  display: string
  previousValue: number | null
  operator: CalculatorOperator | null
  // true logo depois de escolher um operador: o próximo dígito começa um
  // número novo em vez de continuar o que está no visor.
  waitingForOperand: boolean
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
}

const MAX_DIGITS = 12

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.waitingForOperand) {
    return { ...state, display: digit, waitingForOperand: false }
  }
  if (state.display === '0') {
    return { ...state, display: digit }
  }
  if (state.display.replace(/[-,]/g, '').length >= MAX_DIGITS) {
    return state
  }
  return { ...state, display: state.display + digit }
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (state.waitingForOperand) {
    return { ...state, display: '0,', waitingForOperand: false }
  }
  if (state.display.includes(',')) return state
  return { ...state, display: `${state.display},` }
}

export function backspace(state: CalculatorState): CalculatorState {
  if (state.waitingForOperand) return state
  const next = state.display.slice(0, -1)
  return { ...state, display: next === '' || next === '-' ? '0' : next }
}

export function clearAll(): CalculatorState {
  return INITIAL_CALCULATOR_STATE
}

function toNumber(display: string): number {
  return Number(display.replace(',', '.'))
}

function toDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'Erro'
  // Poupa o operador de "0.30000000000000004": arredonda ruído de ponto
  // flutuante antes de mostrar, sem exagerar em casas decimais.
  const rounded = Math.round(value * 1e10) / 1e10
  return rounded
    .toString()
    .replace('.', ',')
    .slice(0, MAX_DIGITS + 1)
}

function apply(a: number, b: number, operator: CalculatorOperator): number {
  switch (operator) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
    case '÷':
      return b === 0 ? Infinity : a / b
  }
}

export function chooseOperator(state: CalculatorState, operator: CalculatorOperator): CalculatorState {
  const current = toNumber(state.display)

  if (state.previousValue === null) {
    return { display: state.display, previousValue: current, operator, waitingForOperand: true }
  }
  if (state.waitingForOperand) {
    return { ...state, operator }
  }
  const result = apply(state.previousValue, current, state.operator ?? operator)
  return { display: toDisplay(result), previousValue: result, operator, waitingForOperand: true }
}

export function calculateResult(state: CalculatorState): CalculatorState {
  if (state.operator === null || state.previousValue === null) return state
  const current = toNumber(state.display)
  const result = apply(state.previousValue, current, state.operator)
  return { display: toDisplay(result), previousValue: null, operator: null, waitingForOperand: true }
}
