import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import './TransferirProprietarioModal.css'

/**
 * Modal de transferência de proprietário de um animal.
 * Mantém o mesmo petId (histórico de consultas/fotos preservado) e registra
 * cada troca de dono em TransferenciaProprietario, como um "histórico de
 * revisão" do animal dentro do app.
 */
export default function TransferirProprietarioModal({ pet, clientes, onClose, onSuccess }) {
  const [novoClienteId, setNovoClienteId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [historico, setHistorico] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetchHistorico()
  }, [])

  const fetchHistorico = async () => {
    try {
      setCarregandoHistorico(true)
      const res = await axios.get(`/api/pets/${pet.id}/historico-proprietarios`)
      if (res.data.sucesso) setHistorico(res.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar histórico de proprietários:', err)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  const handleTransferir = async () => {
    if (!novoClienteId) {
      setErro('Selecione o novo proprietário')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const res = await axios.post(`/api/pets/${pet.id}/transferir`, {
        novoClienteId,
        motivo: motivo.trim() || undefined
      })
      if (res.data.sucesso) {
        onSuccess()
        onClose()
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao transferir animal')
    } finally {
      setSalvando(false)
    }
  }

  const codigoAnimal = `PET-${String(pet.id).padStart(6, '0')}`
  const outrosClientes = clientes.filter(c => c.id !== pet.clienteId)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return createPortal(
    <div className="tpm-overlay" onClick={handleOverlayClick}>
      <div className="tpm-modal">
        <div className="tpm-header">
          <h2>Transferir Proprietário</h2>
          <button className="tpm-close" onClick={onClose}>✕</button>
        </div>

        <div className="tpm-body">
          <div className="tpm-pet-info">
            <span className="tpm-pet-nome">{pet.nome} <span className="tpm-pet-especie">({pet.especie})</span></span>
            <span className="tpm-pet-codigo">{codigoAnimal}</span>
          </div>

          {erro && <div className="tpm-error">{erro}</div>}

          <div className="tpm-group">
            <label>Novo Proprietário *</label>
            <select value={novoClienteId} onChange={e => setNovoClienteId(e.target.value)}>
              <option value="">Selecione...</option>
              {outrosClientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}{c.telefone ? ` — ${c.telefone}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="tpm-group">
            <label>Motivo (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Venda, doação..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
          </div>

          <div className="tpm-historico">
            <h3>Histórico de Proprietários</h3>
            {carregandoHistorico ? (
              <p className="tpm-historico-vazio">Carregando...</p>
            ) : historico.length === 0 ? (
              <p className="tpm-historico-vazio">Nenhuma transferência registrada ainda.</p>
            ) : (
              <div className="tpm-historico-lista">
                {historico.map(h => (
                  <div key={h.id} className="tpm-historico-item">
                    <span className="tpm-historico-data">{formatarData(h.dataTransferencia)}</span>
                    <span className="tpm-historico-texto">
                      {h.ClienteAnterior ? h.ClienteAnterior.nome : 'Cadastro inicial'}
                      {h.ClienteAnterior && ' → '}
                      {h.ClienteAnterior && <strong>{h.ClienteNovo?.nome}</strong>}
                      {!h.ClienteAnterior && <strong> {h.ClienteNovo?.nome}</strong>}
                    </span>
                    {h.motivo && <span className="tpm-historico-motivo">{h.motivo}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tpm-footer">
          <button className="tpm-btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="tpm-btn-confirmar" onClick={handleTransferir} disabled={salvando}>
            {salvando ? 'Transferindo...' : 'Confirmar Transferência'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
