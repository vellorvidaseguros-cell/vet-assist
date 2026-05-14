import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import PhotoUploadModal from './PhotoUploadModal'
import './MobileAgendamentoDetalhes.css'

export default function MobileAgendamentoDetalhes({ agendamentoId, onClose, onSuccess }) {
  const [agendamento, setAgendamento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [formData, setFormData] = useState({
    medicacao: '',
    diagnosticos: '',
    medicamentosInsumos: '',
    observacoes: '',
    proximoAgendamento: ''
  })

  useEffect(() => {
    fetchAgendamento()
  }, [agendamentoId])

  const fetchAgendamento = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/agendamentos/${agendamentoId}`)
      if (response.data.sucesso) {
        setAgendamento(response.data.data)
        setFormData({
          medicacao: response.data.data.medicacao || '',
          diagnosticos: response.data.data.diagnosticos || '',
          medicamentosInsumos: response.data.data.medicamentosInsumos || '',
          observacoes: response.data.data.observacoes || '',
          proximoAgendamento: response.data.data.proximoAgendamento || ''
        })
      }
    } catch (err) {
      setError('Erro ao carregar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await axios.put(`/api/agendamentos/${agendamentoId}`, formData)
      if (response.data.sucesso) {
        setEditMode(false)
        await fetchAgendamento()
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      setError('Erro ao salvar agendamento')
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content detalhes-modal">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        </div>
      </div>
    )
  }

  if (!agendamento) {
    return (
      <div className="modal-overlay">
        <div className="modal-content detalhes-modal">
          <div className="modal-header">
            <h3>Agendamento não encontrado</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      {showPhotoModal && (
        <PhotoUploadModal
          agendamentoId={agendamentoId}
          onClose={() => setShowPhotoModal(false)}
          onUploadSuccess={() => {
            setShowPhotoModal(false)
            fetchAgendamento()
          }}
        />
      )}

      <div className="modal-content detalhes-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="detalhes-titulo">
            <h3>Detalhes do Agendamento</h3>
            <span className="detalhes-data">{formatarData(agendamento.data)} às {agendamento.hora}</span>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="detalhes-body">
          {/* Informações básicas */}
          <div className="detalhes-section info-section">
            <h4>👤 Cliente</h4>
            <p className="detalhes-text">{agendamento.Cliente?.nome}</p>
            <h4>🐾 Animal</h4>
            <p className="detalhes-text">{agendamento.Pet?.nome} ({agendamento.Pet?.especie})</p>
            <h4>💼 Tipo de Atendimento</h4>
            <p className="detalhes-text">{agendamento.tipoAtendimento}</p>
            {agendamento.descricao && (
              <>
                <h4>📝 Descrição</h4>
                <p className="detalhes-text">{agendamento.descricao}</p>
              </>
            )}
            <h4>💰 Valor</h4>
            <p className="detalhes-valor">
              R$ {parseFloat(agendamento.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Seção de Fotos */}
          <div className="detalhes-section fotos-section">
            <div className="section-header">
              <h4>📸 Fotos e Anexos</h4>
              <button
                className="btn-adicionar-foto"
                onClick={() => setShowPhotoModal(true)}
              >
                + Foto
              </button>
            </div>
            {agendamento.photos && agendamento.photos.length > 0 ? (
              <div className="fotos-grid">
                {agendamento.photos.map(photo => (
                  <div key={photo.id} className="foto-item">
                    <img src={photo.url} alt="Anexo" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">Nenhuma foto adicionada</p>
            )}
          </div>

          {/* Formulário de detalhes (edição) */}
          <div className="detalhes-section form-section">
            <div className="form-group">
              <label>💊 Medicação Prescrita</label>
              <textarea
                name="medicacao"
                value={formData.medicacao}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Amoxicilina 500mg, 2x ao dia por 7 dias"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>🔍 Diagnósticos</label>
              <textarea
                name="diagnosticos"
                value={formData.diagnosticos}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Otite externa, Inflamação leve"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>⚕️ Medicamentos e Insumos Utilizados</label>
              <textarea
                name="medicamentosInsumos"
                value={formData.medicamentosInsumos}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Álcool etílico, Gaze estéril, Seringa de 10ml"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>📋 Observações e Notas</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Observações gerais sobre o atendimento"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>📅 Próximo Agendamento Recomendado</label>
              <input
                type="text"
                name="proximoAgendamento"
                value={formData.proximoAgendamento}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Retorno em 7 dias para reavaliação"
                className="form-input"
              />
            </div>
          </div>

          {/* Status */}
          <div className="detalhes-section status-section">
            <h4>📊 Status</h4>
            <div className={`status-badge status-${agendamento.status?.toLowerCase()}`}>
              {agendamento.status}
            </div>
          </div>
        </div>

        {/* Footer / Ações */}
        <div className="modal-actions">
          {!editMode ? (
            <>
              <button
                className="btn-cancelar"
                onClick={onClose}
              >
                Voltar
              </button>
              <button
                className="btn-registrar"
                onClick={() => setEditMode(true)}
              >
                ✏️ Editar
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-cancelar"
                onClick={() => setEditMode(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-registrar"
                onClick={handleSave}
              >
                💾 Salvar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
