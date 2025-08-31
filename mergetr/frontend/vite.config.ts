import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // HTTPS désactivé pour le développement - décommentez et ajoutez les certificats pour la production
    // https: {
    //   key: readFileSync(join(process.cwd(), '..', 'ssl', 'key.pem')),
    //   cert: readFileSync(join(process.cwd(), '..', 'ssl', 'cert.pem'))
    // },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})


