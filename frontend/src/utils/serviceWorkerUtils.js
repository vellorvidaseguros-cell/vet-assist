/**
 * Utilitários para Service Worker
 * Registra SW e configura lembretes
 */

export async function registerServiceWorker() {
  console.log('[SW] Verificando suporte...')
  console.log('[SW] navigator.serviceWorker:', 'serviceWorker' in navigator)

  if (!('serviceWorker' in navigator)) {
    console.log('[SW] ❌ Service Worker não suportado neste navegador')
    return
  }

  try {
    console.log('[SW] 📝 Tentando registrar service-worker.js...')
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })
    console.log('[SW] ✅ Service Worker registrado com sucesso:', registration)

    // Verificar updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] 📦 Nova versão disponível')
          // Notificar usuário (opcional)
        }
      })
    })

    return registration
  } catch (err) {
    console.error('[SW] ❌ Erro ao registrar:', err.message || err)
    console.error('[SW] Stack:', err.stack)
  }
}

/**
 * Pedir permissão para notificações
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[Notif] Notifications não suportadas')
    return false
  }

  if (Notification.permission === 'granted') {
    console.log('[Notif] ✅ Permissão já concedida')
    return true
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      console.log(`[Notif] ${granted ? '✅' : '❌'} Permissão:`, permission)
      return granted
    } catch (err) {
      console.error('[Notif] Erro ao pedir permissão:', err)
      return false
    }
  }

  console.log('[Notif] ⚠️ Permissão bloqueada pelo usuário')
  return false
}

/**
 * Iniciar sincronização periódica de lembretes
 */
export async function startLembreteSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('[Sync] Background Sync não suportado')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-lembretes')
    console.log('[Sync] ✅ Sincronização registrada')
  } catch (err) {
    console.error('[Sync] ❌ Erro:', err)
  }
}

/**
 * Mostrar notificação nativa
 */
export function showNotification(title, options = {}) {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        ...options
      })

      // Auto-fechar após 5 segundos
      setTimeout(() => notif.close(), 5000)
    } catch (err) {
      console.error('[Notif] Erro ao mostrar:', err)
    }
  }
}

/**
 * Enviar mensagem para o Service Worker
 */
export function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message)
  }
}
