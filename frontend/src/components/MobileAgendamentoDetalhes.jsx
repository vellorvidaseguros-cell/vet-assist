import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { formatarData } from '../utils/dateFormatter'
import PhotoUploadModal from './PhotoUploadModal'
import './MobileAgendamentoDetalhes.css'

export default function MobileAgendamentoDetalhes({ agendamentoId, onClose, onSuccess }) {
  const [agendamento, setAgendamento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(true)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [formData, setFormData] = useState({
    medicamentos: '',
    diagnostico: '',
    procedimentos: '',
    observacoes: '',
    proximoRetorno: ''
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
          medicamentos: response.data.data.medicamentos || '',
          diagnostico: response.data.data.diagnostico || '',
          procedimentos: response.data.data.procedimentos || '',
          observacoes: response.data.data.observacoes || '',
          proximoRetorno: response.data.data.proximoRetorno
            ? new Date(response.data.data.proximoRetorno).toISOString().split('T')[0]
            : ''
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

  const [salvando, setSalvando] = useState(false)
  const [salvoComSucesso, setSalvoComSucesso] = useState(false)

  const handleSave = async () => {
    try {
      setSalvando(true)
      setError('')
      const response = await axios.put(`/api/agendamentos/${agendamentoId}`, formData)
      if (response.data.sucesso) {
        setSalvoComSucesso(true)
        await fetchAgendamento()
        if (onSuccess) onSuccess()
        // Fecha automaticamente após salvar
        setTimeout(() => onClose(), 1500)
      }
    } catch (err) {
      setError('Erro ao salvar agendamento')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return createPortal(
      <div className="agdet-overlay">
        <div className="agdet-content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
        </div>
      </div>,
      document.body
    )
  }

  if (!agendamento) {
    return createPortal(
      <div className="agdet-overlay">
        <div className="agdet-content">
          <div className="modal-header">
            <h3>Agendamento não encontrado</h3>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="agdet-overlay">
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

      <div className="agdet-content">
        {/* Header */}
        <div className="agdet-header">
          <h2>Detalhes do Agendamento</h2>
          <p className="agdet-data-hora">{formatarData(agendamento.data)} às {agendamento.hora}</p>
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
                name="medicamentos"
                value={formData.medicamentos}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Amoxicilina 500mg, 2x ao dia por 7 dias"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>🔍 Diagnósticos</label>
              <textarea
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleInputChange}
                disabled={!editMode}
                placeholder="Ex: Otite externa, Inflamação leve"
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>⚕️ Procedimentos / Insumos Utilizados</label>
              <textarea
                name="procedimentos"
                value={formData.procedimentos}
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
                type="date"
                name="proximoRetorno"
                value={formData.proximoRetorno || ''}
                onChange={handleInputChange}
                disabled={!editMode}
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
                style={{ cursor: 'pointer' }}
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
        <div className="agdet-footer">
          <button
            className="agdet-btn-cancelar"
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            className="agdet-btn-salvar"
            onClick={handleSave}
            disabled={salvando}
          >
            {salvando ? '⏳ Salvando...' : salvoComSucesso ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
