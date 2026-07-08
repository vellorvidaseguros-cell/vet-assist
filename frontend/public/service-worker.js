// Service Worker para VetAssist
// IMPORTANTE: NUNCA cachear chamadas de API — sempre buscar dados frescos

const CACHE_NAME = 'vetassist-v25'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// ===== INSTALL =====
self.addEventListener('install', event => {
  console.log('[SW] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[SW] Cache addAll parcial:', err)
      })
    })
  )
  self.skipWaiting()
})

// ===== ACTIVATE — limpa caches antigos =====
self.addEventListener('activate', event => {
  console.log('[SW] Ativando...')
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.map(name => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Limpando cache antigo:', name)
              return caches.delete(name)
            }
          })
        )
      ),
      self.clients.claim()
    ])
  )
})

// ===== FETCH — estratégia diferente para cada tipo =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // NUNCA cachear:
  // - Chamadas de API (/api/*)
  // - Socket.IO (/socket.io/*)
  // - Backend uploads
  // - Requisições não-GET
  // - Hot reload do Vite (@vite, @react-refresh, .hot-update)
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/backend/') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('.hot-update') ||
    url.search.includes('t=')  // queries com timestamp
  ) {
    // Passar direto para a rede, sem cache
    return
  }

  // Assets estáticos: NETWORK FIRST com fallback de cache
  // Sempre tenta buscar a versão mais nova; se falhar (offline), serve do cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear apenas respostas válidas (200) do mesmo origin
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Offline: tentar cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/index.html')
        })
      })
  )
})

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', event => {
  if (!event.data) return
  const data = event.data.json()
  console.log('[SW] Push recebido:', data)

  event.waitUntil(
    self.registration.showNotification(data.title || 'VetAssist', {
      body: data.body || 'Novo lembrete',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'notification',
      data: data.data || {},
      vibrate: [200, 100, 200]
    })
  )
})

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})

// ===== MESSAGE FROM CLIENT =====
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.notification
    event.waitUntil(self.registration.showNotification(title, options || {}))
  }
})
