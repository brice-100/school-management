
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF3FA',
          100: '#C5D6EF',
          200: '#9BBAE4',
          300: '#5E8DCE',
          400: '#3A70BA',
          500: '#1E3A5F', // couleur principale
          600: '#183050',
          700: '#122540',
          800: '#0C1A30',
          900: '#060E1A',
        },
        accent: {
          400: '#3A87D4',
          500: '#2272C3',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}