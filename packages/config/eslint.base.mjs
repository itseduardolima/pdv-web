import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Shared TypeScript rules — apps add their own framework-specific config on top.
export const baseConfig = tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
})
