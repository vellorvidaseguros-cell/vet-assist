import { useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { MessageCircle, CircleCheck } from 'lucide-react'
import './FeedbackWidget.css'

const TIPOS = [
  { valor: 'sugestao', label: 'Sugestão' },
  { valor: 'duvida', label: 'Dúvida' },
  { valor: 'bug', label: 'Problema' },
]

export default function FeedbackWidget() {
  const [aberto, setAberto] = useState(false)
  const [tipo, setTipo] = useState('sugestao')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  const fechar = () => {
    setAberto(false)
    setTimeout(() => {
      setMensagem('')
      setTipo('sugestao')
      setErro('')
      setEnviado(false)
    }, 300)
  }

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

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setAberto(true)}
        title="Enviar dúvida ou sugestão"
      >
        <MessageCircle size={24} />
      </button>

      {aberto && createPortal(
        <div className="feedback-overlay" onClick={fechar}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="feedback-header">
              <h3>Dúvidas e Sugestões</h3>
              <button className="feedback-close" onClick={fechar} type="button">×</button>
            </div>

            {enviado ? (
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
