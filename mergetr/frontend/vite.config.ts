import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://node:5001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://node:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})


