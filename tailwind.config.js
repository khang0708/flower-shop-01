/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        botanical: {
          50: '#F4F7F5',
          100: '#E8EFEA',
          200: '#D1DFD6',
          300: '#A4C0AF',
          400: '#77A189',
          500: '#5C8A70',
          600: '#466F58',
          700: '#345543',
          800: '#264A37',
          900: '#1B3B2B',
          950: '#0F241A',
        },
        blossom: {
          50: '#FDF7F6',
          100: '#FAECE9',
          200: '#F5D6CE',
          300: '#EFAEA1',
          400: '#E8998D',
          500: '#D67D6F',
          600: '#C4685A',
          700: '#A14E42',
        },
        surface: {
          cream: '#FAF8F5',
          paper: '#F3EEE8',
          card: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#222523',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      borderRadius: {
        'organic': '20px',
        'pill': '9999px',
      },
      boxShadow: {
        'organic-soft': '0 12px 32px -8px rgba(27, 59, 43, 0.08)',
        'float-button': '0 8px 24px -4px rgba(232, 153, 141, 0.35)',
      }
    },
  },
  plugins: [],
}
