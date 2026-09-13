import withSerwistInit from '@serwist/next'

// HU 8.3 (PWA): service worker desligado em dev — hot reload e cache de
// service worker brigam entre si; só compila em build de produção.
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@pdv/shared'],
  // Só em desenvolvimento: o browser fala com a API pela mesma origem
  // (/api/*) para o cookie de sessão SameSite funcionar entre
  // demo.app.localhost:3000 e localhost:3001. Em produção web e API
  // compartilham o domínio pai (ver docs/specs/01-arquitetura.md).
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return []
    const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }]
  },
}

export default withSerwist(nextConfig)
