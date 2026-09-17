// "Mercadinho da Maria" -> "mercadinho-da-maria" — só pra pré-preencher o
// campo de identificador; quem valida de verdade é a API (createPlatformTenantSchema).
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
