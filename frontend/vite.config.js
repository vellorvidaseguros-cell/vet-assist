import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Aceita conexões de qualquer IP
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.15.27',
      '.ngrok-free.dev',  // Permite qualquer host ngrok-free.dev
      '.ngrok.dev'        // Permite qualquer host ngrok.dev
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/backend': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
