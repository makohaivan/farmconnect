/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FarmConnect brand colours
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',  // Main brand green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        farm: {
          dark:  '#0D2B4E',   // Dark blue for headers
          mid:   '#1A56A0',   // Medium blue for links
          light: '#F0FDF4',   // Light green for backgrounds
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
