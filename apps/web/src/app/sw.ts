/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// PWA (HU 8.3): cacheia shell da aplicação e catálogo de produtos
// (stale-while-revalidate — o cache local do Dexie, HU 8.1, é quem sustenta
// Vender de fato sem rede; isto aqui é só a camada de asset/navegação).
// Login/PIN nunca ficam em cache: quem decide a sessão precisa ser sempre
// uma resposta fresca do servidor.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        ['/login', '/forgot-pin', '/set-pin'].includes(url.pathname) || url.pathname.startsWith('/api/auth'),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/products'),
      handler: new StaleWhileRevalidate({ cacheName: 'products-cache' }),
    },
    ...defaultCache,
  ],
})

serwist.addEventListeners()
