/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', bg2: 'var(--bg2)', bg3: 'var(--bg3)', border: 'var(--border)',
        text: 'var(--text)', text2: 'var(--text2)', text3: 'var(--text3)',
        accent: 'var(--accent)', accent2: 'var(--accent2)', accent3: 'var(--accent3)', accent4: 'var(--accent4)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        bebas: ['Poppins', 'sans-serif']
      }
    }
  },
  plugins: [],
}