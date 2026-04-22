/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          dark: '#1a3a1a',
          table: '#2d5a2d',
          card: '#3d7a3d',
          light: '#c8e6c8',
        },
        mint: '#b2f0c8',
        cyan: {
          game: '#7dd3c8',
        },
        cream: '#f5f0dc',
        red: {
          belote: '#e53935',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
