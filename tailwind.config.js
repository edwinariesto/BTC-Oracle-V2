/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#ffffff',
        surface: '#ffffff',
        border:  '#e5e7eb',
        accent:  '#7c3aed',
        accent2: '#059669',
        muted:   '#6b7280',
        up:      '#10b981',
        down:    '#f97316',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
