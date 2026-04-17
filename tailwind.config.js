/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        bg: '#F9F8F5',
        surface: '#FFFFFF',
        'surface-2': '#F5F3EE',
        'surface-3': '#EDEAE2',
        primary: '#F5A623',
        'primary-light': '#FFF3DC',
        sky: '#75D1FF',
        'sky-light': '#E8F7FF',
        'text-1': '#1C1C22',
        'text-2': '#5A5A6E',
        'text-3': '#9B9BAE',
      },
      boxShadow: {
        soft: '0 2px 16px rgba(0,0,0,0.06)',
        float: '0 8px 32px rgba(0,0,0,0.08)',
      },
      letterSpacing: {
        label: '0.12em',
      },
    },
  },
  plugins: [],
}
