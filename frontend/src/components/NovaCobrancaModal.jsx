import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import './NovoClienteModal.css'

function useLockBodyScroll() {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])
}

const COBRANCA_VAZIA = {
  historicoConsultaId: '',
  valor: '',
  descricao: '',
  dataVencimento: '',
  dataPagamento: '',
  status: 'Pendente'
}

// cobrancaExistente: passe um faturamento pra abrir o modal em modo edição
// (PUT em vez de POST, com os campos já preenchidos).
export default function NovaCobrancaModal({ onClose, onSuccess, cobrancaExistente }) {
  useLockBodyScroll()
  const { ref: swipeRef, style: swipeStyle } = useSwipeToClose(onClose)
  const editando = !!cobrancaExistente

  const [cobrancaForm, setCobrancaForm] = useState(() => cobrancaExistente ? {
    historicoConsultaId: String(cobrancaExistente.historicoConsultaId || ''),
    valor: String(cobrancaExistente.valor ?? ''),
    descricao: cobrancaExistente.descricao || '',
    dataVencimento: cobrancaExistente.dataVencimento ? String(cobrancaExistente.dataVencimento).substring(0, 10) : '',
    dataPagamento: cobrancaExistente.dataPagamento ? String(cobrancaExistente.dataPagamento).substring(0, 10) : '',
    status: cobrancaExistente.status || 'Pendente'
  } : COBRANCA_VAZIA)
  const [historicos, setHistoricos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(!editando)

  useEffect(() => {
    if (!editando) carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      const [historicoRes, faturamentoRes] = await Promise.all([
        axios.get('/api/historico'),
        axios.get('/api/faturamento')
      ])

      const todosHistoricos = historicoRes.data.sucesso ? (historicoRes.data.data || []) : []

      // Uma consulta já totalmente paga não deve aparecer aqui de novo — só
      // as que ainda não têm cobrança, estão pendentes ou parcialmente pagas.
      const faturamentos = faturamentoRes.data.sucesso ? (faturamentoRes.data.data || []) : []
      const historicoIdsPagos = new Set(
        faturamentos.filter(f => f.status === 'Pago').map(f => f.historicoConsultaId)
      )

      setHistoricos(todosHistoricos.filter(h => !historicoIdsPagos.has(h.id)))
    } catch (err) {
      console.error('Erro ao carregar históricos:', err)
      // Se não conseguir carregar, continua mesmo assim
      setHistoricos([])
    } finally {
      setCarregando(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCobrancaForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSalvar = async () => {
    // Validações
    if (!editando && !cobrancaForm.historicoConsultaId.trim()) {
      setErro('Consulta é obrigatória')
      return
    }
    if (!cobrancaForm.valor || parseFloat(cobrancaForm.valor) <= 0) {
      setErro('Valor deve ser maior que zero')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const payload = {
        valor: parseFloat(cobrancaForm.valor),
        descricao: cobrancaForm.descricao.trim(),
        dataVencimento: cobrancaForm.dataVencimento || null,
        status: cobrancaForm.status
      }
      if (!editando) payload.historicoConsultaId = parseInt(cobrancaForm.historicoConsultaId)

      // Adicionar data de pagamento se status for diferente de Pendente
      if (cobrancaForm.status !== 'Pendente' && cobrancaForm.dataPagamento) {
        payload.dataPagamento = cobrancaForm.dataPagamento
      }

      const response = editando
        ? await axios.put(`/api/faturamento/${cobrancaExistente.id}`, payload)
        : await axios.post('/api/faturamento', payload)

      if (response.data.sucesso) {
        onSuccess()
        onClose()
      } else {
        setErro(response.data.erro || 'Erro ao salvar cobrança')
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar cobrança. Tente novamente.')
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (carregando) {
    return createPortal(
      <div className="ncm-overlay" onClick={handleOverlayClick}>
        <div className="ncm-modal" ref={swipeRef} style={swipeStyle}>
          <div className="ncm-header">
            <h2>{editando ? 'Editar Cobrança' : 'Nova Cobrança'}</h2>
            <button className="ncm-close" onClick={onClose} title="Fechar">×</button>
          </div>
          <div className="ncm-body">
            <p style={{ textAlign: 'center', color: '#8e8e93' }}>Carregando históricos...</p>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="ncm-overlay" onClick={handleOverlayClick}>
      <div className="ncm-modal" ref={swipeRef} style={swipeStyle}>
        {/* HEADER */}
        <div className="ncm-header">
          <h2>{editando ? 'Editar Cobrança' : 'Nova Cobrança'}</h2>
          <button className="ncm-close" onClick={onClose} title="Fechar">×</button>
        </div>

        {/* BODY */}
        <div className="ncm-body">
          {erro && <div className="ncm-error">{erro}</div>}

          {/* CONSULTA */}
          {!editando && (
            <div className="ncm-section">
              <h3 className="ncm-section-title">Consulta</h3>

              <div className="ncm-row single">
                <div className="ncm-group">
                  <label>Consulta (Histórico) *</label>
                  <select
                    name="historicoConsultaId"
                    value={cobrancaForm.historicoConsultaId}
                    onChange={handleInputChange}
                  >
                    <option value="">Selecione uma consulta</option>
                    {historicos.length > 0 ? (
                      historicos.map(historico => (
                        <option key={historico.id} value={historico.id}>
                          {historico.Pet?.nome || 'Pet'} - {historico.data ? new Date(historico.data).toLocaleDateString('pt-BR') : 'Data?'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Nenhuma consulta disponível</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* VALOR E DESCRIÇÃO */}
          <div className="ncm-section">
            <h3 className="ncm-section-title">Detalhes</h3>

            <div className="ncm-row single">
              <div className="ncm-group">
                <label>Valor da Cobrança *</label>
                <input
                  type="number"
                  name="valor"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={cobrancaForm.valor}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="ncm-row single">
              <div className="ncm-group">
                <label>Data de Vencimento</label>
                <div className="ncm-date-wrapper">
                  <input
                    type="date"
                    name="dataVencimento"
                    value={cobrancaForm.dataVencimento}
                    onChange={handleInputChange}
                  />
                </div>
                <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '6px', display: 'block', lineHeight: 1.4 }}>
                  Se preencher, você recebe um aviso quando estiver perto de vencer.
                </small>
              </div>
            </div>

            <div className="ncm-row single">
              <div className="ncm-group">
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  placeholder="Descrição da cobrança (opcional)"
                  value={cobrancaForm.descricao}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* STATUS E DATA */}
          <div className="ncm-section">
            <h3 className="ncm-section-title">Status</h3>

            <div className="ncm-row single">
              <div className="ncm-group">
                <label>Status</label>
                <select
                  name="status"
                  value={cobrancaForm.status}
                  onChange={handleInputChange}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Parcialmente Pago">Parcialmente Pago</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {cobrancaForm.status !== 'Pendente' && (
              <div className="ncm-row single">
                <div className="ncm-group">
                  <label>Data do Pagamento</label>
                  <div className="ncm-date-wrapper">
                    <input
                      type="date"
                      name="dataPagamento"
                      value={cobrancaForm.dataPagamento}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="ncm-footer">
          <button className="ncm-btn-cancelar" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button
            className="ncm-btn-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Cobrança'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
