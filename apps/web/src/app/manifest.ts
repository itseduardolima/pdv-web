import type { MetadataRoute } from 'next'
import { getCurrentTenant } from '@/lib/tenant.server'

// PWA instalável com a identidade do tenant (HU 8.3): nome e ícone vêm do
// tenant resolvido no request, nunca um manifest.json estático com nome
// fixo — mesma regra de 06/07 (white-label) aplicada aqui.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { tenant } = await getCurrentTenant()

  // Logo do tenant: tamanho/tipo reais não são rastreados no upload
  // (aceita PNG/JPEG/WebP, qualquer dimensão) — 'any' deixa o navegador
  // usar o que vier, sem arriscar um `type` errado.
  const icons: MetadataRoute.Manifest['icons'] = tenant?.logoUrl
    ? [{ src: tenant.logoUrl, sizes: 'any', purpose: 'any' }]
    : [
        { src: '/icons/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]

  return {
    name: tenant?.name ?? 'PDV',
    short_name: tenant?.name ?? 'PDV',
    description: 'Ponto de venda para o caixa da loja',
    start_url: '/sell',
    display: 'standalone',
    background_color: '#f4f4f4',
    theme_color: tenant?.primaryColor ?? '#e6e51e',
    icons,
  }
}
