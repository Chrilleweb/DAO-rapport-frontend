/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {
      colors: {
        HeaderBg: '#E30613', 
        toggleBg: '#d20411',
        costumRed: '#D14343',
        costumRedHover: '#B23030',
      },
    },
  },
  plugins: [],
}
