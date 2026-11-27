import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1200px' } },
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        display: ['"Bricolage Grotesque Variable"', '"Inter Variable"', ...defaultTheme.fontFamily.sans],
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
        // Signature accent for promotions and highlights. Always paired with ink text.
        lime: {
          50: '#f8fde7',
          100: '#effbc6',
          200: '#e2f68f',
          300: '#d4f064',
          400: '#c3e43c',
          500: '#a6c81f',
          600: '#7f9b13',
        },
        tile: {
          mint: '#dff5ea',
          lilac: '#ece6fb',
          peach: '#fde7d9',
          sky: '#e0effc',
          butter: '#fbf3c8',
          rose: '#fce4ec',
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
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        raised: '0 10px 30px -12px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.06)',
        overlay: '0 20px 48px rgba(15, 23, 42, 0.18)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(255,255,255,0.18), 0 8px 32px -8px rgba(15,23,42,0.18)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        scan: { '0%': { transform: 'translateY(0)', opacity: '0' }, '10%': { opacity: '1' }, '90%': { opacity: '1' }, '100%': { transform: 'translateY(172px)', opacity: '0' } },
        blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '95%': { transform: 'scaleY(0.1)' } },
        wave: { '0%,60%,100%': { transform: 'rotate(0deg)' }, '70%': { transform: 'rotate(-18deg)' }, '80%': { transform: 'rotate(10deg)' }, '90%': { transform: 'rotate(-12deg)' } },
        pop: { '0%': { opacity: '0', transform: 'scale(0.6) translateY(8px)' }, '70%': { opacity: '1', transform: 'scale(1.06)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        glow: { '0%,100%': { opacity: '0.55', transform: 'scale(1)' }, '50%': { opacity: '0.9', transform: 'scale(1.08)' } },
      },
      animation: {
        scan: 'scan 2.4s ease-in-out infinite',
        blink: 'blink 4.5s ease-in-out infinite',
        wave: 'wave 3.2s ease-in-out infinite',
        pop: 'pop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both',
        glow: 'glow 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
