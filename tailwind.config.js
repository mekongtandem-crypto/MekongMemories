/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ✅ Activation du dark mode via classe
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
