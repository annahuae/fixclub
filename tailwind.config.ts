import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        'ink-dim': 'var(--ink-dim)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        danger: 'var(--danger)',
        success: 'var(--success)'
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        sans: ['"Geist"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
