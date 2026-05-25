import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4f0',
          100: '#fbe5d8',
          200: '#f6c9b0',
          300: '#efa67f',
          400: '#e67a4d',
          500: '#dc5a2a',
          600: '#ce4420',
          700: '#ab331c',
          800: '#882b1d',
          900: '#6e251b',
          950: '#3c100c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
} satisfies Config
