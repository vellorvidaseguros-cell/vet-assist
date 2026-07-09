import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './NotificacoesModal.css'

// Opções de antecedência oferecidas ao vet (valor em minutos)
const OPCOES_ANTECEDENCIA = [
  { min: 15, label: '15 min' },
  { min: 30, label: '30 min' },
  { min: 60, label: '1 hora' },
  { min: 180, label: '3 horas' },
  { min: 1440, label: '1 dia' },
]

const PADRAO = {
  antecedenciasAgendamento: [30],
  avisarVencimentoCobranca: true,
  diasAntesVencimento: 1,
}

export default function NotificacoesModal({ veterinarioId, onClose, onSaved }) {
  const [prefs, setPrefs] = useState(PADRAO)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/api/perfil/${veterinarioId}`)
        const p = res.data?.data?.preferenciasNotificacao
        if (p && typeof p === 'object') {
          setPrefs({ ...PADRAO, ...p, antecedenciasAgendamento: Array.isArray(p.antecedenciasAgendamento) ? p.antecedenciasAgendamento : PADRAO.antecedenciasAgendamento })
        }
      } catch {
        // usa padrão
      } finally {
        setLoading(false)
      }
    })()
  }, [veterinarioId])

  const toggleAntecedencia = (min) => {
    setPrefs(prev => {
      const atual = prev.antecedenciasAgendamento
      const nova = atual.includes(min) ? atual.filter(m => m !== min) : [...atual, min].sort((a, b) => a - b)
      return { ...prev, antecedenciasAgendamento: nova }
    })
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    setOk('')
    try {
      await axios.put(`/api/perfil/${veterinarioId}`, { preferenciasNotificacao: prefs })
      setOk('Preferências salvas!')
      onSaved?.(prefs)
      setTimeout(() => onClose?.(), 800)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar preferências')
    } finally {
      setSalvando(false)
    }
  }

  return createPortal(
    <div className="modal-overlay notif-overlay" onClick={onClose}>
      <div className="modal-content notif-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Notificações</h3>
          <button className="btn-close" onClick={onClose} type="button">×</button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        ) : (
          <div className="notif-body">
            {erro && <div className="notif-erro">{erro}</div>}
            {ok && <div className="notif-ok">{ok}</div>}

            <section className="notif-secao">
              <h4>Lembrete de agendamentos</h4>
              <p className="notif-hint">Quanto tempo antes de cada consulta você quer ser avisado? (pode escolher mais de um)</p>
              <div className="notif-chips">
                {OPCOES_ANTECEDENCIA.map(op => (
                  <button
                    key={op.min}
                    type="button"
                    className={`notif-chip ${prefs.antecedenciasAgendamento.includes(op.min) ? 'ativo' : ''}`}
                    onClick={() => toggleAntecedencia(op.min)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              {prefs.antecedenciasAgendamento.length === 0 && (
                <p className="notif-aviso">Sem nenhuma antecedência marcada, você não recebe lembrete de agendamento.</p>
              )}
            </section>

            <section className="notif-secao notif-secao-embreve">
              <h4>Vencimento de cobranças <span className="notif-badge-embreve">em breve</span></h4>
              <p className="notif-hint">
                Aviso de cobranças a vencer e lembrete/cobrança ao proprietário pelo WhatsApp.
                Para isso, primeiro vamos adicionar uma <strong>data de vencimento</strong> às cobranças.
              </p>
            </section>

            <div className="notif-acoes">
              <button type="button" className="notif-btn-cancelar" onClick={onClose}>Cancelar</button>
              <button type="button" className="notif-btn-salvar" onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
