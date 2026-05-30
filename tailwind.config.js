/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dove: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        accent: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1), inset 0 1px 0 rgb(255 255 255 / 0.08)',
        'card-hover': '0 8px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.15), inset 0 1px 0 rgb(255 255 255 / 0.12)',
        'btn': '0 2px 4px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.1)',
        'btn-hover': '0 4px 8px rgb(0 0 0 / 0.25), inset 0 1px 0 rgb(255 255 255 / 0.15)',
        'btn-active': '0 1px 2px rgb(0 0 0 / 0.3), inset 0 2px 4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
