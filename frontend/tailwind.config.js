/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ice: {
          50: '#f0f7fb',
          100: '#dbeef7',
          200: '#b8ddef',
          300: '#8ec7e3',
          400: '#5aa8d1',
          500: '#3a8bb8',
          600: '#2c6d94',
          700: '#265777',
          800: '#1f4560',
          900: '#0b1e2d',
          950: '#060f18',
        },
      },
    },
  },
  plugins: [],
};
