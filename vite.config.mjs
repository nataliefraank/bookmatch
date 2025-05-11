import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import flowbiteReact from 'flowbite-react/plugin/vite'

export default defineConfig({
  plugins: [react(), flowbiteReact()],
  server: {
    host: true,
    port: 5173
  },
  base: './'
})
