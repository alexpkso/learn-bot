import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4361EE',
          light: '#EEF2FF',
        },
        surface: '#FFFFFF',
        bg: '#F2F5FA',
        border: '#E8ECF4',
        text: {
          1: '#1B2559',
          2: '#8A97B0',
        },
        green: '#22C55E',
        red: '#EF4444',
        orange: '#F97316',
        amber: '#F59E0B',
      },
      borderRadius: {
        card: '11px',
        pill: '20px',
        btn: '7px',
      },
    },
  },
  plugins: [],
}

export default config
