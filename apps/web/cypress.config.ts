import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
  component: {
    devServer: { framework: 'next', bundler: 'webpack' },
    specPattern: 'src/**/*.cy.tsx',
    supportFile: 'cypress/support/component.ts',
  },
})
