import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1200px' } },
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#ecfdf6',
          100: '#d1faea',
          200: '#a6f2d5',
          300: '#6ce3bb',
          400: '#31cb9b',
          500: '#0eb082',
          600: '#048f6b',
          700: '#047258',
          800: '#075b47',
          900: '#084b3c',
          950: '#032a22',
        },
        ink: {
          DEFAULT: '#0b1220',
          muted: '#475569',
          subtle: '#64748b',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        raised: '0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)',
        overlay: '0 20px 48px rgba(15, 23, 42, 0.18)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
