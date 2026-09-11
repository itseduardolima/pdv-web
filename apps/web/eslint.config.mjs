import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  {
    ignores: [
      '.next/**',
      'cypress/videos/**',
      'cypress/screenshots/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Padrão idiomático do Cypress para estender tipos globais.
    files: ['cypress/support/**/*.ts'],
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },
  {
    files: ['*.config.mjs'],
    rules: { 'import/no-anonymous-default-export': 'off' },
  },
]
