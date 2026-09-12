import { defineConfig } from 'cypress'

// E2E roda contra o app real no host da loja demo (tenant resolvido pelo subdomínio).
const baseUrl = process.env.CYPRESS_BASE_URL ?? 'http://demo.app.localhost:3000'

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    defaultCommandTimeout: 10_000,
  },
  component: {
    devServer: { framework: 'next', bundler: 'webpack' },
    specPattern: 'src/**/*.cy.tsx',
    supportFile: 'cypress/support/component.ts',
  },
})
