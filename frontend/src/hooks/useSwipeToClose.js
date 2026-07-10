import { useState, useEffect, useRef } from 'react'

// Arrastar a partir da borda esquerda da tela fecha o modal, imitando o
// gesto nativo de "voltar" do iOS (a PWA não tem isso de graça).
// Uso: const { ref, style } = useSwipeToClose(onClose)
//      <div ref={ref} style={style} className="...">
const BORDA_ATIVACAO_PX = 30
const LIMIAR_FECHAR_FRACAO = 0.6 // precisa arrastar 60% da largura da tela pra fechar

export function useSwipeToClose(onClose) {
  const [arrastoX, setArrastoX] = useState(0)
  const [arrastando, setArrastando] = useState(false)
  // direcao: null (ainda não decidiu) | 'horizontal' | 'vertical'
  const toqueRef = useRef({ ativo: false, inicioX: 0, inicioY: 0, direcao: null })
  // onClose muda de referência a cada render do pai — guardamos num ref pra
  // não precisar recriar os listeners quando ela muda.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  // Guarda a função de limpeza dos listeners do elemento atualmente anexado.
  const limparListenersRef = useRef(null)

  // Ref-callback: dispara assim que o elemento realmente existe no DOM (ex: só
  // depois que "Carregando..." vira o conteúdo real). Um useEffect com [] não
  // serve aqui porque na primeira renderização o elemento pode ainda não existir.
  const ref = (el) => {
    if (limparListenersRef.current) {
      limparListenersRef.current()
      limparListenersRef.current = null
    }
    if (!el) return

    const onStart = (e) => {
      const touch = e.touches[0]
      if (touch.clientX > BORDA_ATIVACAO_PX) return
      toqueRef.current = { ativo: true, inicioX: touch.clientX, inicioY: touch.clientY, direcao: null }
    }

    const onMove = (e) => {
      if (!toqueRef.current.ativo) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - toqueRef.current.inicioX
      const deltaY = touch.clientY - toqueRef.current.inicioY

      // Decide a direção do gesto assim que houver deslocamento suficiente,
      // e trava nela — evita que o dedo "vaze" pro scroll vertical no meio do arrasto.
      if (!toqueRef.current.direcao && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
        toqueRef.current.direcao = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }

      if (toqueRef.current.direcao === 'vertical') {
        toqueRef.current.ativo = false
        return
      }

      if (toqueRef.current.direcao === 'horizontal') {
        e.preventDefault() // bloqueia o scroll vertical nativo durante o arrasto
        if (deltaX > 0) {
          setArrastando(true)
          setArrastoX(deltaX)
        }
      }
    }

    const onEnd = () => {
      if (!toqueRef.current.ativo) return
      toqueRef.current.ativo = false
      setArrastando(false)
      setArrastoX(prev => {
        if (prev > window.innerWidth * LIMIAR_FECHAR_FRACAO) {
          onCloseRef.current()
          return prev
        }
        return 0
      })
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    limparListenersRef.current = () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }

  const style = {
    transform: `translateX(${arrastoX}px)`,
    transition: arrastando ? 'none' : 'transform 0.25s ease',
    boxShadow: arrastoX > 0 ? '-8px 0 24px rgba(0,0,0,0.15)' : undefined
  }

  return { ref, style }
}
