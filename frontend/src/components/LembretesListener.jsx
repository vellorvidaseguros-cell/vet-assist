/**
 * Componente para ouvir lembretes via Socket.IO
 * Mostran notificações quando há agendamento próximo
 */
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { showNotification } from '../utils/serviceWorkerUtils'

export default function LembretesListener() {
  const socketRef = useRef(null)
  const notificacoesRef = useRef(new Set())

  useEffect(() => {
    // Conectar ao Socket.IO
    const socket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] ✅ Conectado ao servidor')
      socket.emit('ativarLembretes')
    })

    socket.on('disconnect', () => {
      console.log('[Socket] ❌ Desconectado do servidor')
    })

    // Ouvir lembretes
    socket.on('lembrete', (data) => {
      handleLembrete(data)
    })

    socket.on('error', (err) => {
      console.error('[Socket] Erro:', err)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const handleLembrete = (data) => {
    const chave = `${data.id}-${data.tipo}`

    // Evitar duplicatas
    if (notificacoesRef.current.has(chave)) {
      return
    }

    notificacoesRef.current.add(chave)

    // Limpar após 2 horas
    setTimeout(() => {
      notificacoesRef.current.delete(chave)
    }, 2 * 60 * 60 * 1000)

    console.log('[Lembrete] 🔔', data)

    // Mostrar notificação nativa
    if ('Notification' in window && Notification.permission === 'granted') {
      showNotification(data.titulo, {
        body: data.body,
        tag: chave,
        data: {
          agendamentoId: data.id,
          cliente: data.cliente,
          pet: data.pet
        }
      })
    }

    // Se estiver usando Service Worker, enviar push
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          title: data.titulo,
          options: {
            body: data.body,
            tag: chave,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            data: {
              agendamentoId: data.id
            }
          }
        }
      })
    }
  }

  return null // Componente invisível
}
