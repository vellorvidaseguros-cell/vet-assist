/**
 * Teste final do sistema de lembretes
 * Conecta a Socket.IO e aguarda notificações
 */

import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  reconnection: true,
  transports: ['websocket', 'polling']
})

let lembreteRecebido = false

socket.on('connect', () => {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Socket.IO conectado`)
})

socket.on('lembrete', (data) => {
  lembreteRecebido = true
  console.log(`\n[${new Date().toLocaleTimeString('pt-BR')}] 🔔 LEMBRETE RECEBIDO!`)
  console.log(`├─ Agendamento ID: ${data.id}`)
  console.log(`├─ Cliente: ${data.cliente}`)
  console.log(`├─ Pet: ${data.pet}`)
  console.log(`├─ Hora: ${data.hora}`)
  console.log(`├─ Tipo: ${data.tipo}`)
  console.log(`└─ Mensagem: ${data.body}\n`)
})

socket.on('error', (err) => {
  console.error(`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro:`, err)
})

socket.on('connect_error', (err) => {
  console.error(`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro de conexão:`, err.message)
})

// Log a cada 30 segundos para mostrar que está funcionando
const interval = setInterval(() => {
  if (!lembreteRecebido) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ⏳ Aguardando...`)
  }
}, 30000)

// Timeout após 10 minutos
setTimeout(() => {
  clearInterval(interval)
  if (!lembreteRecebido) {
    console.log(`\n[${new Date().toLocaleTimeString('pt-BR')}] ⏱️ Timeout - Nenhum lembrete recebido`)
  }
  socket.disconnect()
  process.exit(0)
}, 10 * 60 * 1000)
