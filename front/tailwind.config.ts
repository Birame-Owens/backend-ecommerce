import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        beige: {
          50:  '#FFFDF9',
          100: '#F8F3ED',
          200: '#EFE4D6',
          300: '#E6D8CA',
          400: '#C9A98A',
          500: '#B68A64',
        },
        ink:   '#1E1E1E',
        muted: '#6B6B6B',
        sage:  '#B7D7C0',
        blush: '#E7B8B8',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        beige:    '0 2px 16px 0 rgba(180,138,100,0.10)',
        'beige-lg': '0 8px 32px 0 rgba(180,138,100,0.14)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
