import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system ndeya-design
        paper:   '#F8F3ED',
        surface: '#FFFFFF',
        ink:     '#1E1E1E',
        'ink-2': '#4A4843',
        muted:   '#8A8278',
        line:    '#ECE2D4',
        'line-2':'#E0D2BF',
        sand:    '#E8D8C4',
        camel:   '#C9A98A',
        accent: {
          DEFAULT: '#B76E4D',
          dark:    '#9C5839',
          light:   '#FCF8F2',
        },
        btn: {
          DEFAULT: '#B98A63',
          dark:    '#9E7350',
        },
        wa:   '#1FA855',
        'wa-d':'#178A45',
        star:  '#C9942B',
        ok:    '#3E8E5A',
        // Admin palette (kept for compatibility)
        beige: {
          50:  '#FFFDF9',
          100: '#F8F3ED',
          200: '#EFE4D6',
          300: '#E6D8CA',
          400: '#C9A98A',
          500: '#B68A64',
        },
      },
      fontFamily: {
        sans:   ['Poppins', 'system-ui', 'sans-serif'],
        serif:  ['"Playfair Display"', 'Georgia', 'serif'],
        ui:     ['Poppins', 'system-ui', 'sans-serif'],
        inter:  ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        btn:  '10px',
        sm:   '9px',
      },
      boxShadow: {
        card:     '0 1px 2px rgba(30,30,30,.04), 0 10px 28px -16px rgba(120,90,60,.30)',
        'card-lg':'0 24px 60px -22px rgba(80,55,35,.42)',
        beige:    '0 2px 16px 0 rgba(180,138,100,0.10)',
        'beige-lg':'0 8px 32px 0 rgba(180,138,100,0.14)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
