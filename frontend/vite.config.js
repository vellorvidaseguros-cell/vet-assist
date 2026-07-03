import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Ler porta do backend automaticamente do arquivo gerado pelo server.js
function lerPortaBackend() {
  const portaDefault = 5000
  const caminhos = [
    resolve(__dirname, '../.backend-port'),
    resolve(__dirname, '../../.backend-port'),
  ]
  for (const caminho of caminhos) {
    try {
      const porta = parseInt(readFileSync(caminho, 'utf8').trim())
      if (!isNaN(porta) && porta > 0) {
        console.log(`[Vite] 🔌 Backend detectado na porta ${porta} (via .backend-port)`)
        return porta
      }
    } catch {}
  }
  console.log(`[Vite] 🔌 Usando porta padrão ${portaDefault}`)
  return portaDefault
}

const backendPort = lerPortaBackend()
// Usar localhost em dev local, mas permitir IP externo se necessário
const backendUrl = process.env.BACKEND_HOST
  ? `http://${process.env.BACKEND_HOST}:${backendPort}`
  : `http://localhost:${backendPort}`

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.15.27',
      '.ngrok-free.dev',
      '.ngrok.dev'
    ],
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true
      },
      '/backend': {
        target: backendUrl,
        changeOrigin: true
      },
      '/socket.io': {
        target: backendUrl,
        changeOrigin: true,
        ws: true
      }
    }
  }
})
