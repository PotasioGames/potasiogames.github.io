/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./assets/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        potasio: {
          primary: '#f4ee5a', // Yellow
          secondary: '#c578cb',  // Bordo/Burgundy
        },
        dark: {
          900: '#0a0f1a',
          800: '#111827',
          700: '#1f2937',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px #f4ee5a, 0 0 20px #f4ee5a' },
          'to': { boxShadow: '0 0 20px #f4ee5a, 0 0 30px #f4ee5a' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
