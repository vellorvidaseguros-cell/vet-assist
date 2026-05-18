// Service Worker para VetAssist
// Handles push notifications e background tasks

const CACHE_NAME = 'vetassist-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[SW] Cache addAll failed:', err)
        // Não falhar se algum arquivo não existir
      })
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - cache first strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone())
          return response
        })
      })
    }).catch(() => {
      return caches.match('/index.html')
    })
  )
})

// Push notification
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('[SW] Push sem dados')
    return
  }

  const data = event.data.json()
  console.log('[SW] Push recebido:', data)

  const options = {
    body: data.body || 'Novo lembrete',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'notification',
    data: data.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'VetAssist', options)
  )
})

// Notification click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notificação clicada:', event.notification.tag)
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Procurar janela já aberta
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Periodic background sync para lembretes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-lembretes') {
    console.log('[SW] Sincronizando lembretes...')
    event.waitUntil(
      fetch('/api/agendamentos/lembretes')
        .then(res => res.json())
        .then(data => {
          console.log('[SW] Lembretes:', data)
        })
        .catch(err => console.error('[SW] Erro ao sincronizar:', err))
    )
  }
})

// Message from client
self.addEventListener('message', event => {
  console.log('[SW] Message recebida:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
