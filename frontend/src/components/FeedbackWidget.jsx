import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { MessageCircle, CircleCheck, Megaphone } from 'lucide-react'
import { isAdmin } from '../utils/conta'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import './FeedbackWidget.css'

const TIPOS = [
  { valor: 'sugestao', label: 'Sugestão' },
  { valor: 'duvida', label: 'Dúvida' },
  { valor: 'bug', label: 'Problema' },
]

const CHAVE_ULTIMO_AVISO_LIDO = 'ultimoAvisoLidoId'

export default function FeedbackWidget() {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState('avisos') // 'avisos' | 'enviar'
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(() => fechar())

  const [tipo, setTipo] = useState('sugestao')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  const [avisos, setAvisos] = useState([])
  const [temAvisoNovo, setTemAvisoNovo] = useState(false)
  const [novoAvisoTexto, setNovoAvisoTexto] = useState('')
  const [enviandoAviso, setEnviandoAviso] = useState(false)
  const [erroAviso, setErroAviso] = useState('')

  const admin = isAdmin()

  const buscarAvisos = async () => {
    try {
      const res = await axios.get('/api/avisos')
      if (res.data.sucesso) {
        const lista = res.data.data || []
        setAvisos(lista)
        const ultimoLido = localStorage.getItem(CHAVE_ULTIMO_AVISO_LIDO)
        const maisRecente = lista[0]
        setTemAvisoNovo(!!maisRecente && String(maisRecente.id) !== ultimoLido)
      }
    } catch { /* silencioso — não é crítico pro resto do app */ }
  }

  useEffect(() => {
    buscarAvisos()
    // Socket já é mantido pelo LembretesListener; ele dispara esse evento
    // na janela assim que um aviso novo chega, sem precisar de outra conexão.
    const handleNovoAviso = () => buscarAvisos()
    window.addEventListener('novoAvisoRecebido', handleNovoAviso)
    return () => window.removeEventListener('novoAvisoRecebido', handleNovoAviso)
  }, [])

  const abrir = () => {
    setAberto(true)
    setAba('avisos')
  }

  const fechar = () => {
    setAberto(false)
    setTimeout(() => {
      setMensagem('')
      setTipo('sugestao')
      setErro('')
      setEnviado(false)
      setNovoAvisoTexto('')
      setErroAviso('')
    }, 300)
  }

  // Marca como lido assim que a aba de avisos é aberta com o mais recente já carregado
  useEffect(() => {
    if (aberto && aba === 'avisos' && avisos.length > 0) {
      localStorage.setItem(CHAVE_ULTIMO_AVISO_LIDO, String(avisos[0].id))
      setTemAvisoNovo(false)
    }
  }, [aberto, aba, avisos])

  const enviar = async () => {
    if (!mensagem.trim()) {
      setErro('Escreva sua dúvida ou sugestão antes de enviar.')
      return
    }
    setEnviando(true)
    setErro('')
    try {
      await axios.post('/api/feedback', { tipo, mensagem })
      setEnviado(true)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const enviarAviso = async () => {
    if (!novoAvisoTexto.trim()) {
      setErroAviso('Escreva o aviso antes de enviar.')
      return
    }
    setEnviandoAviso(true)
    setErroAviso('')
    try {
      await axios.post('/api/avisos', { mensagem: novoAvisoTexto })
      setNovoAvisoTexto('')
      await buscarAvisos()
    } catch (e) {
      setErroAviso(e.response?.data?.erro || 'Erro ao enviar aviso.')
    } finally {
      setEnviandoAviso(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={abrir}
        title="Dúvidas, sugestões e avisos"
      >
        <MessageCircle size={24} />
        {temAvisoNovo && <span className="feedback-badge" />}
      </button>

      {aberto && createPortal(
        <div className="feedback-overlay" onClick={fechar}>
          <div className="feedback-modal" ref={swipeRef} style={swipeStyle} onClick={e => e.stopPropagation()}>
            <div className="feedback-header">
              <h3>Dúvidas e Sugestões</h3>
              <button className="feedback-close" onClick={fechar} type="button">×</button>
            </div>

            <div className="feedback-abas">
              <button
                type="button"
                className={`feedback-aba-btn ${aba === 'avisos' ? 'ativa' : ''}`}
                onClick={() => setAba('avisos')}
              >
                Avisos {temAvisoNovo && <span className="feedback-badge-inline" />}
              </button>
              <button
                type="button"
                className={`feedback-aba-btn ${aba === 'enviar' ? 'ativa' : ''}`}
                onClick={() => setAba('enviar')}
              >
                Enviar
              </button>
            </div>

            {aba === 'avisos' ? (
              <div className="feedback-avisos-lista">
                {admin && (
                  <div className="feedback-novo-aviso">
                    <textarea
                      className="feedback-textarea"
                      rows={3}
                      placeholder="Escreva um aviso pra todos os veterinários (ex: novidades, melhorias)..."
                      value={novoAvisoTexto}
                      onChange={e => setNovoAvisoTexto(e.target.value)}
                    />
                    {erroAviso && <div className="feedback-erro">{erroAviso}</div>}
                    <button
                      type="button"
                      className="feedback-btn-enviar"
                      onClick={enviarAviso}
                      disabled={enviandoAviso}
                    >
                      {enviandoAviso ? 'Enviando...' : 'Publicar Aviso'}
                    </button>
                  </div>
                )}

                {avisos.length === 0 ? (
                  <p className="feedback-hint">Nenhum aviso por enquanto.</p>
                ) : (
                  avisos.map(a => (
                    <div key={a.id} className="feedback-aviso-item">
                      <div className="feedback-aviso-icone"><Megaphone size={16} /></div>
                      <div className="feedback-aviso-conteudo">
                        <p>{a.mensagem}</p>
                        <span className="feedback-aviso-meta">
                          {a.autorNome} • {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : enviado ? (
              <div className="feedback-sucesso">
                <div className="feedback-sucesso-icone"><CircleCheck size={32} color="var(--color-success)" /></div>
                <p>Enviado! Obrigado pelo retorno.</p>
                <button type="button" className="feedback-btn-enviar" onClick={fechar}>Fechar</button>
              </div>
            ) : (
              <>
                <p className="feedback-hint">
                  Encontrou um problema? Tem uma ideia pra melhorar o app? Escreva aqui — sua mensagem vai direto pra equipe.
                </p>

                <div className="feedback-tipos">
                  {TIPOS.map(t => (
                    <button
                      key={t.valor}
                      type="button"
                      className={`feedback-tipo-chip ${tipo === t.valor ? 'ativo' : ''}`}
                      onClick={() => setTipo(t.valor)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="feedback-textarea"
                  rows={5}
                  placeholder="Escreva aqui..."
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  autoFocus
                />

                {erro && <div className="feedback-erro">{erro}</div>}

                <div className="feedback-acoes">
                  <button type="button" className="feedback-btn-cancelar" onClick={fechar}>Cancelar</button>
                  <button type="button" className="feedback-btn-enviar" onClick={enviar} disabled={enviando}>
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
