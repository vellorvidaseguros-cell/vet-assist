import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import './AnimalHistoryModal.css'

export default function AnimalHistoryModal({ petId, petName, onClose }) {
  const [historicos, setHistoricos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [fotoLightbox, setFotoLightbox] = useState(null)

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    fetchHistorico()
  }, [petId])

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const fetchHistorico = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`/api/historico/animal/${petId}`)
      if (res.data.sucesso) {
        // Ordena por data mais recente primeiro
        const sorted = (res.data.data || []).sort((a, b) =>
          new Date(b.data) - new Date(a.data)
        )
        setHistoricos(sorted)
      } else {
        setError('Erro ao carregar histórico')
      }
    } catch (err) {
      setError('Erro ao carregar histórico do animal')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  if (loading) {
    return createPortal(
      <div className="modal-overlay">
        <div className="modal-content detalhes-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando histórico...</div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content detalhes-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>📋 {petName}</h3>
            <span className="detalhes-data">{historicos.length} atendimento(s)</span>
          </div>
          <button className="btn-close" onClick={onClose} type="button">×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="detalhes-body">
          {historicos.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8e8e93', padding: '2rem 1rem' }}>
              <p>Nenhum atendimento registrado</p>
            </div>
          ) : (
            <div className="historico-timeline">
              {historicos.map((hist, idx) => {
                const id = hist.id || idx
                const isExpanded = expandedIds.has(id)
                return (
                  <div key={id} className="historico-item">
                    <div className="historico-date-marker">
                      <div className="marker-dot"></div>
                    </div>

                    <div
                      className={`historico-card ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleExpand(id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="historico-header">
                        <div className="historico-date">
                          📅 {formatarData(hist.data)}
                        </div>
                        {hist.valor && (
                          <div className="historico-valor">
                            {formatarValor(hist.valor)}
                          </div>
                        )}
                      </div>

                      {/* Sempre visível: tipo de atendimento */}
                      {hist.tipoAtendimento && (
                        <div className="historico-field">
                          <span className="historico-label">Tipo de Atendimento:</span>
                          <span className="historico-value">{hist.tipoAtendimento}</span>
                        </div>
                      )}

                      {/* Conteúdo expandido */}
                      {isExpanded && (
                        <>
                          {hist.procedimentos && (
                            <div className="historico-field">
                              <span className="historico-label">Procedimentos:</span>
                              <span className="historico-value">{hist.procedimentos}</span>
                            </div>
                          )}

                          {hist.diagnostico && (
                            <div className="historico-field">
                              <span className="historico-label">Diagnóstico:</span>
                              <span className="historico-value">{hist.diagnostico}</span>
                            </div>
                          )}

                          {hist.observacoes && (
                            <div className="historico-field">
                              <span className="historico-label">Observações:</span>
                              <span className="historico-value">{hist.observacoes}</span>
                            </div>
                          )}

                          {hist.medicamentos && (
                            <div className="historico-field">
                              <span className="historico-label">Medicamentos:</span>
                              <span className="historico-value">{hist.medicamentos}</span>
                            </div>
                          )}

                          {hist.proximoRetorno && (
                            <div className="historico-field">
                              <span className="historico-label">Próximo Retorno:</span>
                              <span className="historico-value">{new Date(hist.proximoRetorno).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}

                          {/* Fotos do atendimento */}
                          {hist.Anexos && hist.Anexos.length > 0 && (
                            <div className="historico-field">
                              <span className="historico-label">📸 Fotos ({hist.Anexos.length}):</span>
                              <div className="historico-fotos-grid">
                                {hist.Anexos.map(anexo => (
                                  <img
                                    key={anexo.id}
                                    src={anexo.caminhoArquivo}
                                    alt={anexo.nomeArquivo}
                                    className="historico-foto-thumb"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFotoLightbox(anexo.caminhoArquivo)
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {hist.veterinario && (
                            <div className="historico-footer">
                              👨‍⚕️ {hist.veterinario}
                            </div>
                          )}
                        </>
                      )}

                      {/* Indicador visual de clique */}
                      <div className="historico-toggle">
                        <span className="toggle-icon">{isExpanded ? '▲ Recolher' : '▼ Ver detalhes'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button type="button" className="btn-cancelar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox de foto */}
      {fotoLightbox && (
        <div className="foto-lightbox-overlay" onClick={() => setFotoLightbox(null)}>
          <img src={fotoLightbox} alt="Foto ampliada" className="foto-lightbox-img" onClick={e => e.stopPropagation()} />
          <button className="foto-lightbox-voltar" onClick={() => setFotoLightbox(null)}>
            ← Voltar
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}
