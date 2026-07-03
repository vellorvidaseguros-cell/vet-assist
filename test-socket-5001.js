/**
 * Teste Socket.IO na porta 5001
 */

import { io } from 'socket.io-client'

console.log('[TEST] Conectando a http://localhost:5001...')
console.log('[TEST] Hora atual:', new Date().toLocaleTimeString('pt-BR'))

const socket = io('http://localhost:5001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('\n[TEST] ✅ CONECTADO ao servidor Socket.IO!')
  console.log('[TEST] ID da conexão:', socket.id)
  console.log('[TEST] Transport:', socket.io.engine.transport.name)
  console.log('[TEST] Aguardando lembretes...\n')
})

socket.on('connect_error', (err) => {
  console.error('[TEST] ❌ Erro de conexão:', err.message)
})

socket.on('disconnect', (reason) => {
  console.log('[TEST] ❌ Desconectado:', reason)
})

socket.on('lembrete', (data) => {
  console.log('\n=====================================')
  console.log('[TEST] 🔔 LEMBRETE RECEBIDO!')
  console.log('=====================================')
  console.log('Agendamento ID:', data.id)
  console.log('Título:', data.titulo)
  console.log('Mensagem:', data.body)
  console.log('Cliente:', data.cliente)
  console.log('Pet:', data.pet)
  console.log('Hora:', data.hora)
  console.log('Tipo:', data.tipo)
  console.log('Timestamp:', data.timestamp)
  console.log('Hora atual:', new Date().toLocaleTimeString('pt-BR'))
  console.log('=====================================\n')
})

console.log('[TEST] Aguardando eventos por 2 minutos...')

setTimeout(() => {
  console.log('[TEST] ⏱️ Tempo limite atingido (10 minutos).')
  socket.disconnect()
  process.exit(0)
}, 10 * 60 * 1000)
