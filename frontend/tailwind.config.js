/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        'nsg-primary': '#1e40af',
        'nsg-secondary': '#3b82f6',
        'nsg-accent': '#60a5fa',
      },
      boxShadow: {
        hig1: '0 1px 2px rgba(0, 0, 0, 0.06)',
        hig2: '0 6px 24px rgba(0, 0, 0, 0.10)',
        higGlass: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        higSm: '10px',
        higMd: '14px',
        higLg: '18px',
      },
      transitionTimingFunction: {
        hig: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        higFast: '150ms',
        higNormal: '200ms',
        higSlow: '250ms',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeInDown: 'fadeInDown 150ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fadeIn: 'fadeIn 120ms ease-out both',
      },
    },
  },
  plugins: [],
}
