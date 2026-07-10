import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
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
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
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
    <div className="notif-overlay" onClick={onClose}>
      <div className="notif-modal" ref={swipeRef} style={swipeStyle} onClick={e => e.stopPropagation()}>
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

            <section className="notif-secao">
              <h4>Vencimento de cobranças</h4>
              <p className="notif-hint">
                Avisa quando uma cobrança com data de vencimento estiver perto de vencer (ou já vencida).
                Defina a data de vencimento ao criar a cobrança em Cobranças → Nova Cobrança.
              </p>
              <label className="notif-check-row">
                <input
                  type="checkbox"
                  checked={prefs.avisarVencimentoCobranca}
                  onChange={(e) => setPrefs(prev => ({ ...prev, avisarVencimentoCobranca: e.target.checked }))}
                />
                Avisar sobre cobranças a vencer
              </label>
              {prefs.avisarVencimentoCobranca && (
                <div className="notif-dias">
                  <label>Avisar com quantos dias de antecedência?</label>
                  <select
                    value={prefs.diasAntesVencimento}
                    onChange={(e) => setPrefs(prev => ({ ...prev, diasAntesVencimento: parseInt(e.target.value) }))}
                  >
                    <option value={0}>No dia do vencimento</option>
                    <option value={1}>1 dia antes</option>
                    <option value={2}>2 dias antes</option>
                    <option value={3}>3 dias antes</option>
                    <option value={7}>7 dias antes</option>
                  </select>
                </div>
              )}
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
