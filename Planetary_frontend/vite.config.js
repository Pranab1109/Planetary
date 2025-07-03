import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://backend:5000/auth', // Only during dev (won’t apply in prod)
      '/api': 'http://backend:5000/api'
    }
  }
})
