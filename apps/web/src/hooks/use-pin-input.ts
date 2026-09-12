import { useCallback, useState } from 'react'

export const PIN_LENGTH = 4

// Só estado do teclado: compõe dígitos até o limite, apaga e limpa.
// Nenhuma validação — quem decide se o PIN é válido é a API.
export function usePinInput() {
  const [pin, setPin] = useState('')

  const append = useCallback((digit: string) => {
    setPin((current) => (current.length >= PIN_LENGTH ? current : current + digit))
  }, [])
  const backspace = useCallback(() => setPin((current) => current.slice(0, -1)), [])
  const clear = useCallback(() => setPin(''), [])

  return { pin, append, backspace, clear }
}
