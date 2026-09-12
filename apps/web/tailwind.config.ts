import type { Config } from 'tailwindcss'

// Cores/raios apontam para CSS variables: o tema do tenant troca em runtime
// sem rebuild (ver docs/DESIGN_SYSTEM.md).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-ink': 'var(--color-primary-ink)',
        ink: 'var(--color-ink)',
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        card: 'var(--radius-card)',
        'card-sm': 'var(--radius-card-sm)',
        input: 'var(--radius-input)',
        frame: 'var(--radius-frame)',
        nav: 'var(--radius-nav)',
      },
      boxShadow: {
        nav: 'var(--shadow-nav)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
      keyframes: {
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 150ms ease-out',
        pop: 'pop 300ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
