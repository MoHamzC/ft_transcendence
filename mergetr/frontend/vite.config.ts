import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
// Allow overriding backend host (service name) via env. Default to localhost (previous default 'node' cassait en local)
const backendHost = process.env.VITE_BACKEND_HOST || 'localhost';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
  target: `https://localhost:8443`,
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: `https://localhost:8443`,
        changeOrigin: true,
        secure: false
      }
    }
  }
})


