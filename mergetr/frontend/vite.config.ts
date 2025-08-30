import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../ssl/cert.pem'))
    },
    proxy: {
      '/api': {
        target: 'https://node:5001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'https://node:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})


