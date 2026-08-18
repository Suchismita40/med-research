/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f6f8f3',
          100: '#e8eddf',
          200: '#d1dbc1',
          300: '#b1c29b',
          400: '#8a9a5b',
          500: '#6b7d41',
          600: '#556b2f',
          700: '#445625',
          800: '#3f5123',
          900: '#2b3818',
          950: '#19220d',
        },
        surface: {
          bg: '#f8f9f5',
          card: '#ffffff',
          border: '#e4e8df',
          muted: '#f0f3eb',
        },
        primaryText: '#1f2618',
        mutedText: '#66705a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(31, 38, 24, 0.05), 0 1px 2px -1px rgba(31, 38, 24, 0.03)',
        card: '0 4px 6px -1px rgba(31, 38, 24, 0.06), 0 2px 4px -2px rgba(31, 38, 24, 0.04)',
        hover: '0 10px 15px -3px rgba(85, 107, 47, 0.1), 0 4px 6px -4px rgba(85, 107, 47, 0.05)',
      }
    },
  },
  plugins: [],
};
