/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          dark: 'rgb(var(--primary-dark))',
        },
        secondary: 'rgb(var(--secondary))',
        gray: {
          200: 'rgb(var(--gray-200))',
          300: 'rgb(var(--gray-300))',
          600: 'rgb(var(--gray-600))',
        },
        green: {
          DEFAULT: 'var(--green)',
          dark: 'var(--green-dark)',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', scale: '0.95' },
          '100%': { opacity: '1', scale: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-in-out forwards',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
