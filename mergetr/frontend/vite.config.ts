import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
// Allow overriding backend host (service name) via env (e.g. VITE_BACKEND_HOST=node or backend-dev)
const backendHost = process.env.VITE_BACKEND_HOST || 'node';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${backendHost}:5001`,
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: `http://${backendHost}:5001`,
        changeOrigin: true,
        secure: false
      }
    }
  }
})


