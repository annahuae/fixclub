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
        'border-strong': 'var(--border-strong)',
        ink: 'var(--ink)',
        'ink-mid': 'var(--ink-mid)',
        'ink-dim': 'var(--ink-dim)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-strong': 'var(--accent-strong)',
        star: 'var(--star)',
        danger: 'var(--danger)',
        success: 'var(--success)'
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
