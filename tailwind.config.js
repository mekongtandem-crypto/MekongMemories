/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ✅ Activation du dark mode via classe
  darkMode: 'class',
  theme: {
    extend: {
      // ⭐ v2.26g : Animation pulse lente pour nouveaux souvenirs
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
