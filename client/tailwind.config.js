/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slot: {
          available: '#fecaca',
          occupied: '#ef4444'
        }
      }
    }
  },
  plugins: []
};
