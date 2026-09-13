import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Палитра бренда «Гастрономия Коми»: северная природа
        primary: {
          50: '#eef7f2',
          100: '#d5ebdf',
          200: '#abd7bf',
          300: '#7cbf9b',
          400: '#4ea377',
          500: '#2f8a5b',
          600: '#1f6e46',
          700: '#1a5a3b',
          800: '#164831',
          900: '#123c29',
        },
        accent: {
          DEFAULT: '#d98e2b',
          light: '#f0b566',
        },
        nordic: {
          DEFAULT: '#2b4a6f',
          light: '#4a6d96',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;