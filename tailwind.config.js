/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./JedRar/**/*.{html,js,ts}",
    "./privacy.html",
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
          950: '#050811',
          900: '#0a0f1a',
          800: '#111827',
          700: '#1f2937',
        },
        orbitar: {
          space: '#0B1019',
          star: '#8B949E',
          player: '#48CAE4',
          start: '#25527E',
          'start-rim': '#4A85BE',
          goal: '#1D7853',
          'goal-rim': '#38B27C',
          plasma: '#D96B27',
          filament: '#FFA94D',
          core: '#FFF3BF',
          shield: '#00E5FF',
          danger: '#B83826',
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
        sans: ['Outfit', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
