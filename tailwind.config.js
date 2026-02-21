/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#16a34a",
        "primary-soft": "#A0D2EB",
        "background-light": "#f6f8f7",
        "background-dark": "#102218",
        "text-light": "#111814",
        "text-dark": "#f6f8f7",
        "subtext-light": "#618972",
        "subtext-dark": "#a0b5ab",
        "border-light": "#dbe6e0",
        "border-dark": "#3a4c42",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [],
}
