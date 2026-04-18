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
        bg: '#FAF5EC',
        surface: '#FFFFFF',
        'surface-2': '#F5EEE2',
        'surface-3': '#EDE4D3',
        primary: '#E5870A',
        'primary-light': '#FEF5E6',
        gold: '#F5AC32',
        sky: '#6DC2E8',
        'sky-light': '#EBF7FF',
        terra: '#C4502A',
        'text-1': '#1A1208',
        'text-2': '#5B4833',
        'text-3': '#9B8570',
        sidebar: '#150F08',
        'sidebar-surface': '#1F1509',
        'sidebar-border': '#2E1E0A',
        'sidebar-muted': '#7A6048',
      },
      boxShadow: {
        soft: '0 2px 16px rgba(26,18,8,0.07)',
        float: '0 8px 32px rgba(26,18,8,0.10)',
        amber: '0 4px 24px rgba(229,135,10,0.22)',
        'amber-lg': '0 8px 40px rgba(229,135,10,0.30)',
      },
      letterSpacing: {
        label: '0.12em',
        wider: '0.08em',
      },
    },
  },
  plugins: [],
}
