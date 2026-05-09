/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        bg:              'var(--color-bg)',
        surface:         'var(--color-surface)',
        'surface-2':     'var(--color-surface-2)',
        'surface-3':     'var(--color-surface-3)',
        primary:         'var(--color-primary)',
        'primary-light': 'var(--color-primary-light)',
        gold:            'var(--color-gold)',
        sky:             'var(--color-sky)',
        'sky-light':     'var(--color-sky-light)',
        terra:           'var(--color-terra)',
        'text-1':        'var(--color-text-1)',
        'text-2':        'var(--color-text-2)',
        'text-3':        'var(--color-text-3)',
        sidebar:         'var(--color-sidebar)',
        'sidebar-surface': 'var(--color-sidebar-surface)',
        'sidebar-border':  'var(--color-sidebar-border)',
        'sidebar-muted':   'var(--color-sidebar-muted)',
        border:          'var(--color-border)',
      },
      boxShadow: {
        card:       'var(--shadow-card)',
        soft:       'var(--shadow-soft)',
        float:      'var(--shadow-float)',
        amber:      'var(--shadow-amber)',
        'amber-lg': 'var(--shadow-amber-lg)',
      },
      letterSpacing: {
        label: '0.12em',
        wider: '0.08em',
      },
    },
  },
  plugins: [],
}
