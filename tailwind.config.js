// tailwind.config.js
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./node_modules/flowbite-react/**/*.js", // 👈 Flowbite React components
      "./node_modules/flowbite/**/*.js", // 👈 Flowbite core styles
    ],
    theme: {
      extend: {},
    },
    plugins: [
      require('flowbite/plugin'), // 👈 Flowbite plugin
    ],
  }
  