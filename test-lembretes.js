/**
 * Script de teste para verificar se os lembretes estão funcionando
 * Conecta via Socket.IO e aguarda eventos de lembrete
 */

import { io } from 'socket.io-client'

console.log('[TEST] Iniciando teste de lembretes...')
console.log('[TEST] Hora atual:', new Date().toLocaleTimeString('pt-BR'))

const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('[TEST] ✅ Conectado ao servidor Socket.IO!')
  console.log('[TEST] ID da conexão:', socket.id)
  console.log('[TEST] Aguardando lembretes por 2 minutos...')
})

socket.on('connect_error', (err) => {
  console.error('[TEST] ❌ Erro de conexão:', err.message)
})

socket.on('disconnect', (reason) => {
  console.log('[TEST] ❌ Desconectado:', reason)
})

socket.on('lembrete', (data) => {
  console.log('\n[TEST] 🔔 LEMBRETE RECEBIDO!')
  console.log('  ID do agendamento:', data.id)
  console.log('  Título:', data.titulo)
  console.log('  Mensagem:', data.body)
  console.log('  Cliente:', data.cliente)
  console.log('  Pet:', data.pet)
  console.log('  Hora:', data.hora)
  console.log('  Tipo:', data.tipo)
  console.log('  Hora atual:', new Date().toLocaleTimeString('pt-BR'))
})

socket.on('error', (err) => {
  console.error('[TEST] ❌ Erro Socket.IO:', err)
})

console.log('[TEST] Aguardando eventos...')
console.log('[TEST] Você pode interromper com Ctrl+C\n')

// Aguardar por 2 minutos
const timeout = setTimeout(() => {
  console.log('\n[TEST] ⏱️ Tempo limite atingido (2 minutos). Encerrando teste...')
  socket.disconnect()
  process.exit(0)
}, 2 * 60 * 1000)

// Permitir encerramento com Ctrl+C
process.on('SIGINT', () => {
  console.log('\n[TEST] Encerrando...')
  clearTimeout(timeout)
  socket.disconnect()
  process.exit(0)
})
