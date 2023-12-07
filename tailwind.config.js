const colors = require('tailwindcss/colors')
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
      colors: {
        // Configure your color palette here
        primary: colors.green,
      }
  },

  plugins: [
    require('flowbite/plugin') // add this line
  ],
}