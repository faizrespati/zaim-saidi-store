/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'warm-ivory': '#F7F3EA',
        'paper-white': '#FFFDF8',
        'ink-black': '#24211D',
        'forest-green': '#315C4C',
      }
    },
  },
  plugins: [],
}