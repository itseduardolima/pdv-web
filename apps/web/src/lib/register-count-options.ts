import { TENANT_LIMITS } from '@pdv/shared'

// HU 11.6: opções do seletor "Quantidade de caixas" em Configurações,
// 1..TENANT_LIMITS.registerCount.max — o mesmo limite que o backend valida.
export const REGISTER_COUNT_OPTIONS = Array.from(
  { length: TENANT_LIMITS.registerCount.max - TENANT_LIMITS.registerCount.min + 1 },
  (_, index) => {
    const count = TENANT_LIMITS.registerCount.min + index
    return { value: String(count), label: count === 1 ? '1 caixa' : `${count} caixas` }
  },
)
