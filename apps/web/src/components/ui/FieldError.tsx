// Mensagem abaixo do campo: exatamente o texto que a API devolveu.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 font-body text-xs font-medium text-danger">
      {message}
    </p>
  )
}
