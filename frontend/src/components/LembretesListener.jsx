/**
 * Componente de Lembretes com Socket.IO
 * - Alertas visuais SEMPRE aparecem (sem depender de permissão)
 * - Notificações nativas no browser desktop e Android
 * - Instruções específicas para iOS
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

// Detectar plataforma
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isAndroid = /android/i.test(navigator.userAgent)
const isMobile = isIOS || isAndroid
const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
              window.navigator.standalone === true

// Descobrir URL do backend para Socket.IO
// O Vite proxy de WebSocket é instável; conectar DIRETO ao backend quando possível.
async function descobrirSocketUrl() {
  const origin = window.location.origin
  const hostname = window.location.hostname
  const ehHttps = window.location.protocol === 'https:'

  // Caso 1: HTTPS (ngrok/cloudflare/produção) → usar origin (proxy é confiável)
  if (import.meta.env.PROD || ehHttps) {
    console.log('[Socket] Usando origin HTTPS:', origin)
    return origin
  }

  // Caso 2: HTTP - tentar descobrir porta do backend via /api/backend-info
  // (esta requisição passa pelo Vite proxy HTTP que funciona)
  try {
    const res = await fetch('/api/backend-info', { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const info = await res.json()
      if (info.porta) {
        // Construir URL direta usando o mesmo hostname (localhost ou IP da LAN)
        const url = `http://${hostname}:${info.porta}`
        console.log('[Socket] Backend direto:', url)
        return url
      }
    }
  } catch (e) {
    console.warn('[Socket] /api/backend-info falhou:', e.message)
  }

  // Caso 3: Fallback - testar portas diretamente no mesmo hostname
  for (const porta of [5000, 5001, 5002, 5003, 5004, 5005, 4200, 3000]) {
    try {
      const res = await fetch(`http://${hostname}:${porta}/api/status`, {
        signal: AbortSignal.timeout(500)
      })
      if (res.ok) {
        console.log('[Socket] Backend encontrado em', `${hostname}:${porta}`)
        return `http://${hostname}:${porta}`
      }
    } catch {}
  }

  console.warn('[Socket] Nenhum backend encontrado, usando origin como fallback')
  return origin
}

export default function LembretesListener() {
  const socketRef = useRef(null)
  const notificacoesRef = useRef(new Set())
  const [alertas, setAlertas] = useState([])
  const [banner, setBanner] = useState(null) // null | 'pedir' | 'ios' | 'concedido' | 'bloqueado'

  const removerAlerta = useCallback((id) => {
    setAlertas(prev => prev.filter(a => a.id !== id))
  }, [])

  // Verificar estado da permissão e decidir banner
  useEffect(() => {
    if (!('Notification' in window)) {
      // iOS Safari sem PWA - não suporta notificações
      if (isIOS && !isPWA) setBanner('ios')
      return
    }

    const perm = Notification.permission
    if (perm === 'granted') {
      setBanner(null)
    } else if (isIOS && isPWA) {
      // No iOS PWA: sempre mostrar modal para pedir com user gesture
      // O iOS bloqueia silenciosamente quando chamado sem toque
      setBanner('pedir')
    } else if (perm === 'default') {
      setBanner('pedir')
    } else if (perm === 'denied') {
      setBanner('bloqueado')
    }
  }, [])

  const handleLembrete = useCallback((data) => {
    const chave = `${data.id}-${data.tipo}`
    if (notificacoesRef.current.has(chave)) return
    notificacoesRef.current.add(chave)
    setTimeout(() => notificacoesRef.current.delete(chave), 2 * 60 * 60 * 1000)

    console.log('[Lembrete] 🔔 Recebido:', data)

    // 1. Alerta visual (SEMPRE funciona, independente de permissão)
    setAlertas(prev => [{
      id: chave,
      titulo: data.titulo,
      mensagem: data.body,
      cliente: data.cliente,
      pet: data.pet,
      hora: data.hora,
      tipo: data.tipo,
      hora_recebido: new Date().toLocaleTimeString('pt-BR')
    }, ...prev.slice(0, 4)])

    setTimeout(() => removerAlerta(chave), 30000)

    // 2. Notificação nativa — preferir Service Worker (essencial para iOS PWA)
    if ('Notification' in window && Notification.permission === 'granted') {
      const notifOptions = {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: chave,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { agendamentoId: data.id }
      }

      // Prioridade 1: Service Worker (funciona em iOS PWA, Android, Desktop)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(reg => reg.showNotification(data.titulo, notifOptions))
          .catch(err => {
            console.warn('[Notif] SW showNotification falhou, tentando new Notification():', err.message)
            // Fallback: Notification direta (desktop)
            try {
              const n = new Notification(data.titulo, notifOptions)
              setTimeout(() => n.close(), 10000)
            } catch (err2) {
              console.error('[Notif] Falha total:', err2.message)
            }
          })
      } else {
        // Sem Service Worker: usar Notification direto
        try {
          const n = new Notification(data.titulo, notifOptions)
          setTimeout(() => n.close(), 10000)
        } catch (err) {
          console.error('[Notif] Erro:', err.message)
        }
      }
    }
  }, [removerAlerta])

  // Conectar Socket.IO
  useEffect(() => {
    let cancelado = false

    descobrirSocketUrl().then(url => {
      if (cancelado) return

      console.log('[Socket] Conectando a:', url)
      const socket = io(url, {
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 15000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling']
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('[Socket] ✅ Conectado! ID:', socket.id)
        socket.emit('ativarLembretes')
      })
      socket.on('connect_error', err => console.warn('[Socket] ⚠️', err.message))
      socket.on('disconnect', reason => console.log('[Socket] Desconectado:', reason))
      socket.on('lembrete', handleLembrete)
    })

    return () => {
      cancelado = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [handleLembrete])

  // Pedir permissão de notificação — DEVE ser chamado dentro de um toque do usuário
  const pedirPermissao = async () => {
    if (!('Notification' in window)) {
      if (isIOS && !isPWA) setBanner('ios')
      return
    }

    try {
      console.log('[Notif] Solicitando permissão (user gesture)...')
      const perm = await Notification.requestPermission()
      console.log('[Notif] Resposta:', perm)

      if (perm === 'granted') {
        setBanner(null)
        // Notificação de confirmação via Service Worker (iOS PWA precisa disso)
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready
            await reg.showNotification('🔔 Lembretes ativados!', {
              body: 'Você receberá avisos 5 e 30 minutos antes das consultas.',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              vibrate: [200, 100, 200]
            })
          } else {
            new Notification('🔔 Lembretes ativados!', {
              body: 'Você receberá avisos 5 e 30 minutos antes das consultas.',
              icon: '/favicon.ico'
            })
          }
        } catch (e) {
          console.warn('[Notif] Não conseguiu mostrar confirmação:', e.message)
        }
      } else if (perm === 'denied') {
        if (isIOS && isPWA) setBanner('reinstalar')
        else setBanner('bloqueado')
      }
    } catch (err) {
      console.error('[Notif] Erro:', err)
      if (isIOS) setBanner('reinstalar')
    }
  }

  return (
    <>
      {/* ===== BANNER DE AÇÃO ===== */}

      {/* Modal para pedir permissão — aparece no centro da tela */}
      {banner === 'pedir' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '32px 24px', maxWidth: '360px', width: '100%',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔔</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>
              Ativar Lembretes
            </div>
            <div style={{ fontSize: '15px', color: '#555', marginBottom: '28px', lineHeight: 1.5 }}>
              Receba avisos automáticos <strong>5 e 30 minutos</strong> antes de cada consulta agendada.
            </div>
            <button
              onClick={pedirPermissao}
              style={{
                width: '100%', padding: '16px',
                background: '#0d6b3a', color: 'white',
                border: 'none', borderRadius: '12px',
                fontSize: '17px', fontWeight: '700',
                cursor: 'pointer', marginBottom: '12px'
              }}
            >
              ✅ Ativar agora
            </button>
            <button
              onClick={() => setBanner(null)}
              style={{
                width: '100%', padding: '12px',
                background: 'transparent', color: '#999',
                border: 'none', borderRadius: '12px',
                fontSize: '14px', cursor: 'pointer'
              }}
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {/* iOS: instruções para instalar PWA */}
      {banner === 'ios' && (
        <div style={{ ...estilosBanner.container, background: '#1a73e8' }}>
          <div style={estilosBanner.texto}>
            📱 Para notificações no iPhone: toque em <strong>⎙ Compartilhar</strong> → <strong>Adicionar à Tela Inicial</strong>
          </div>
          <button onClick={() => setBanner(null)} style={estilosBanner.fechar}>✕</button>
        </div>
      )}

      {/* iOS: Precisa reinstalar o PWA para resetar permissões */}
      {banner === 'reinstalar' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '28px 24px', maxWidth: '360px', width: '100%',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔄</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>
              Reinstalar o App
            </div>
            <div style={{ fontSize: '14px', color: '#444', marginBottom: '20px', lineHeight: 1.7, textAlign: 'left' }}>
              O iPhone precisa de um reset de permissão. Faça assim:<br/><br/>
              <strong>1.</strong> Pressione e segure o ícone do VetAssist<br/>
              <strong>2.</strong> Toque <strong>"Remover App"</strong><br/>
              <strong>3.</strong> Abra o <strong>Safari</strong> e acesse o site<br/>
              <strong>4.</strong> <strong>⎙ Compartilhar → Adicionar à Tela Inicial</strong><br/>
              <strong>5.</strong> Abra pelo ícone → toque <strong>"Ativar agora"</strong><br/><br/>
              <span style={{ color: '#888', fontSize: '12px' }}>
                Isso vai registrar o app corretamente nas notificações do iPhone.
              </span>
            </div>
            <button onClick={() => setBanner(null)} style={{
              width: '100%', padding: '14px',
              background: '#0d6b3a', color: 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer'
            }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Bloqueado no iOS — modal com instruções */}
      {banner === 'bloqueado' && isIOS && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '28px 24px', maxWidth: '360px', width: '100%',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚙️</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>
              Ativar no iPhone
            </div>
            <div style={{ fontSize: '14px', color: '#444', marginBottom: '20px', lineHeight: 1.7, textAlign: 'left' }}>
              Para ativar as notificações do VetAssist no iPhone, siga os passos:<br/><br/>
              <strong>1.</strong> Feche este app<br/>
              <strong>2.</strong> Abra <strong>Configurações ⚙️</strong> do iPhone<br/>
              <strong>3.</strong> Role até encontrar <strong>VetAssist</strong><br/>
              <strong>4.</strong> Toque em <strong>Notificações</strong><br/>
              <strong>5.</strong> Ative <strong>"Permitir Notificações"</strong><br/><br/>
              <span style={{ color: '#888', fontSize: '13px' }}>
                ⚠️ Se VetAssist não aparecer na lista, remova o app da tela inicial e adicione novamente pelo Safari.
              </span>
            </div>
            <button
              onClick={() => setBanner(null)}
              style={{
                width: '100%', padding: '14px',
                background: '#0d6b3a', color: 'white',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Bloqueado no Android/Desktop */}
      {banner === 'bloqueado' && !isIOS && (
        <div style={{
          position: 'fixed', top: '10px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 9998,
          background: '#856404', color: 'white',
          padding: '10px 14px', borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          maxWidth: '90vw', fontSize: '12px', lineHeight: '1.4'
        }}>
          <span>🔕 Notificações bloqueadas — toque no 🔒 cadeado e permita</span>
          <button onClick={() => setBanner(null)} style={{
            background: 'none', border: 'none', color: 'white',
            fontSize: '16px', cursor: 'pointer', padding: '2px 6px', flexShrink: 0
          }}>✕</button>
        </div>
      )}

      {/* ===== ALERTAS VISUAIS DE LEMBRETES ===== */}
      <div style={estilosAlertas.wrapper}>
        {alertas.map(alerta => (
          <div
            key={alerta.id}
            onClick={() => removerAlerta(alerta.id)}
            style={{
              ...estilosAlertas.card,
              background: alerta.tipo === '5min'
                ? 'linear-gradient(135deg, #dc3545, #b02a37)'
                : 'linear-gradient(135deg, #fd7e14, #c96a00)'
            }}
          >
            <div style={estilosAlertas.titulo}>🔔 {alerta.titulo}</div>
            <div style={estilosAlertas.mensagem}>{alerta.mensagem}</div>
            <div style={estilosAlertas.info}>
              <span>👤 {alerta.cliente}</span>
              <span>🐾 {alerta.pet}</span>
              <span>🕐 {alerta.hora_recebido}</span>
            </div>
            <div style={estilosAlertas.fechar}>Toque para fechar</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  )
}

const estilosBanner = {
  container: {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9998,
    background: '#0d6b3a',
    color: 'white',
    padding: '14px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    maxWidth: '90vw',
    width: 'max-content'
  },
  botao: {
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.8)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  texto: {
    fontSize: '14px',
    lineHeight: 1.4
  },
  fechar: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    flexShrink: 0
  }
}

const estilosAlertas = {
  wrapper: {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: 'min(380px, 95vw)'
  },
  card: {
    color: 'white',
    padding: '16px 18px',
    borderRadius: '14px',
    boxShadow: '0 6px 28px rgba(0,0,0,0.4)',
    cursor: 'pointer',
    borderLeft: '5px solid rgba(255,255,255,0.4)',
    animation: 'slideInRight 0.35s ease-out',
    userSelect: 'none'
  },
  titulo: {
    fontWeight: '700',
    fontSize: '15px',
    marginBottom: '6px'
  },
  mensagem: {
    fontSize: '14px',
    marginBottom: '8px',
    lineHeight: 1.4
  },
  info: {
    fontSize: '12px',
    opacity: 0.85,
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  fechar: {
    fontSize: '11px',
    opacity: 0.6,
    marginTop: '6px',
    textAlign: 'right'
  }
}
