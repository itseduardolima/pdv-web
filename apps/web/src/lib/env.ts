export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  apiInternalUrl: process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  // Host reservado do painel Superadmin (Épico 13) — mesmo valor de
  // PLATFORM_HOST na API. Só usado no servidor (layout.tsx), por isso sem
  // prefixo NEXT_PUBLIC_.
  platformHost: process.env.PLATFORM_HOST ?? 'admin.app.localhost',
  // Domínio base dos subdomínios de loja (<slug>.APP_BASE_DOMAIN) — mesmo
  // valor de APP_BASE_DOMAIN na API. Usado no painel Superadmin (telas de
  // criar/listar lojas, client component) só pra exibir o endereço, nunca
  // pra resolver tenant de verdade — por isso precisa de NEXT_PUBLIC_.
  appBaseDomain: process.env.NEXT_PUBLIC_APP_BASE_DOMAIN ?? 'app.localhost',
}
