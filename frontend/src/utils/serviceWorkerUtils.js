/**
 * Service Worker - Registro com auto-update
 * IMPORTANTE: Esta função NÃO pede permissão de notificação.
 * Permissão deve ser pedida apenas em resposta a um clique do usuário
 * (ver LembretesListener.jsx).
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker não suportado neste navegador')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'  // sempre buscar versão nova do SW
    })
    console.log('[SW] ✅ Registrado:', registration.scope)

    // Verificar update a cada 60 segundos
    setInterval(() => {
      registration.update().catch(() => {})
    }, 60000)

    // Quando uma nova versão estiver disponível, ativar imediatamente
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] 🔄 Nova versão disponível, atualizando...')
          newWorker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })

    // Quando o SW ativo mudar, recarregar a página
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      console.log('[SW] 🔄 Recarregando com nova versão...')
      window.location.reload()
    })

    return registration
  } catch (err) {
    console.error('[SW] ❌ Erro ao registrar:', err.message)
    return null
  }
}
