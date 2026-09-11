import { baseConfig } from '@pdv/config/eslint.base.mjs'

export default [
  { ignores: ['dist/**'] },
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]
