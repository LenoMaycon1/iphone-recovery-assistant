/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: '#F4F5F7',
          100: '#E6E8EC',
          200: '#C9CDD5',
          300: '#A3A9B5',
          400: '#7B828F',
          500: '#5A616D',
          600: '#444A55',
          700: '#2E333C',
          800: '#1B1E24',
          850: '#14161B',
          900: '#0E1014',
          950: '#08090B',
        },
        electric: {
          50: '#EEF5FF',
          100: '#D9E8FF',
          200: '#B3D1FF',
          300: '#7FB0FF',
          400: '#4D8DFF',
          500: '#1F6FFF',
          600: '#0B5BEB',
          700: '#0A47B8',
          800: '#0B3A8F',
          900: '#0B2A66',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(31,111,255,0.35), 0 8px 32px -8px rgba(31,111,255,0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
