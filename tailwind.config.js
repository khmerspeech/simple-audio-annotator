import theme from 'tailwindcss/defaultTheme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans Khmer", ...theme.fontFamily.sans]
      }
    },
  },
  plugins: [],
}