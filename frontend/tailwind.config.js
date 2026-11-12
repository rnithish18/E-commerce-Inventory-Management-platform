/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — orange for CTAs/offers/active only
        primary: {
          DEFAULT: '#ea580c',
          hover:   '#c2410c',
          light:   '#fff7ed',
          text:    '#9a3412',
        },
        // Neutral palette
        neutral: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Semantic (light mode)
        surface: '#ffffff',
        'surface-raised': '#f9fafb',
        'surface-border': '#e5e7eb',
        // Dark mode shells (admin + dark storefront)
        navy: {
          600: '#1e3a5f',
          700: '#172d4a',
          800: '#0f1e33',
          900: '#090e1a',
          950: '#020617',
        },
        // Data-driven chip colours
        badge: {
          sale: '#dc2626',
          new:  '#16a34a',
          best: '#d97706',
        },
      },
      borderRadius: {
        card: '6px',
        btn:  '6px',
        chip: '20px',
      },
      boxShadow: {
        card:         '0 1px 3px 0 rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
        dropdown:     '0 8px 24px 0 rgb(0 0 0 / 0.14)',
      },
    },
  },
  plugins: [],
};
