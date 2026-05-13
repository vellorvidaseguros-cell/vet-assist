import { useState, useEffect } from 'react'
import axios from 'axios'
import PhotoUploadModal from './PhotoUploadModal'
import StatusMenu from './StatusMenu'
import DiagnosisModal from './DiagnosisModal'
import { formatarData } from '../utils/dateFormatter'
import './DashboardHome.css'

export default function DashboardHome() {
  const [agendamentos, setAgendamentos] = useState([])
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false)
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState(null)

  useEffect(() => {
    fetchData()
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Carregar agendamentos
      let agendamentos = []
      try {
        const agendRes = await axios.get('/api/agendamentos')
        if (agendRes.data.sucesso) {
          const hoje = new Date().toISOString().split('T')[0]
          agendamentos = (agendRes.data.data || [])
            .filter(a => {
              const dataPart = new Date(a.data).toISOString().split('T')[0]
              return dataPart >= hoje && a.status !== 'Concluído'
            })
            .sort((a, b) => {
              const dataAStr = a.data.split('T')[0]
              const dataBStr = b.data.split('T')[0]
              if (dataAStr !== dataBStr) {
                return dataAStr.localeCompare(dataBStr)
              }
              return a.hora.localeCompare(b.hora)
            })
            .slice(0, 20)
        }
      } catch (agendErr) {
        console.error('Erro ao carregar agendamentos:', agendErr)
      }

      // Carregar resumo financeiro
      let resumoFinanceiro = null
      try {
        const resumoRes = await axios.get('/api/faturamento/resumo/financeiro')
        if (resumoRes.data.sucesso) {
          resumoFinanceiro = resumoRes.data.data
        }
      } catch (resumoErr) {
        console.error('Erro ao carregar resumo financeiro:', resumoErr)
        // Usar valores padrão
        resumoFinanceiro = {
          faturamentoMes: 0,
          atendidosHoje: 0,
          totalFechadoHoje: 0,
          aReceber: 0,
          quantidadeAReceber: 0
        }
      }

      setAgendamentos(agendamentos)
      setResumo(resumoFinanceiro)
    } catch (err) {
      console.error('Erro geral ao carregar dashboard:', err)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (agendamentoId, novoStatus) => {
    try {
      // Encontrar o agendamento para pegar o valor
      const agendamento = agendamentos.find(a => a.id === agendamentoId)
      const payload = {
        status: novoStatus
      }

      // Se for marcar como Concluído, enviar também o valor
      if (novoStatus === 'Concluído' && agendamento?.valor) {
        payload.valor = agendamento.valor
      }

      const response = await axios.put(`/api/agendamentos/${agendamentoId}`, payload)
      if (response.data.sucesso) {
        setError('')
        await fetchData()
      }
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar status')
    }
  }

  const handlePhotoButtonClick = (agendamentoId) => {
    setSelectedAgendamentoId(agendamentoId)
    setShowPhotoModal(true)
  }

  const handlePhotoUploadSuccess = () => {
    fetchData()
  }

  const handleDiagnosisButtonClick = (agendamentoId) => {
    setSelectedAgendamentoId(agendamentoId)
    setShowDiagnosisModal(true)
  }

  const handleDiagnosisSave = () => {
    fetchData()
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <div className="dashboard-home">
      {error && <div className="error-message">{error}</div>}

      {showPhotoModal && (
        <PhotoUploadModal
          agendamentoId={selectedAgendamentoId}
          onClose={() => setShowPhotoModal(false)}
          onUploadSuccess={handlePhotoUploadSuccess}
        />
      )}

      {showDiagnosisModal && (
        <DiagnosisModal
          agendamentoId={selectedAgendamentoId}
          onClose={() => setShowDiagnosisModal(false)}
          onSave={handleDiagnosisSave}
        />
      )}

      {/* Cards de Resumo Financeiro */}
      <div className="resumo-cards">
        <div className="card financial">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <p className="card-label">Faturamento do Mês</p>
            <p className="card-value">R$ {resumo?.faturamentoMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</p>
          </div>
        </div>

        <div className="card success">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <p className="card-label">Atendidos Hoje</p>
            <p className="card-value">{resumo?.atendidosHoje || 0}</p>
          </div>
        </div>

        <div className="card warning">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <p className="card-label">À Receber</p>
            <p className="card-value">R$ {resumo?.aReceber?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</p>
            <p className="card-subtitle">{resumo?.quantidadeAReceber || 0} pendentes</p>
          </div>
        </div>

        <div className="card info">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <p className="card-label">Faturado Hoje</p>
            <p className="card-value">R$ {resumo?.totalFechadoHoje?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</p>
          </div>
        </div>
      </div>

      {/* Próximos Agendamentos */}
      <div className="agenda-section">
        <h2>📅 Agenda do Dia</h2>

        {agendamentos.length === 0 ? (
          <div className="empty-message">
            <p>Nenhum agendamento agendado</p>
          </div>
        ) : (
          <div className="agenda-list">
            {agendamentos.map(agendamento => {
              const dataFormatada = formatarData(agendamento.data)
              return (
                <div key={agendamento.id} className="agenda-item">
                  <div className="col-acoes">
                    <StatusMenu
                      currentStatus={agendamento.status}
                      onStatusChange={handleStatusChange}
                      agendamentoId={agendamento.id}
                    />
                    <button
                      className="btn-diagnosis"
                      onClick={() => handleDiagnosisButtonClick(agendamento.id)}
                      title="Diagnóstico e Observações"
                    >
                      📋
                    </button>
                    <button
                      className="btn-photo"
                      onClick={() => handlePhotoButtonClick(agendamento.id)}
                      title="Adicionar fotos"
                    >
                      📸
                    </button>
                  </div>
                  <div className="col-data">
                    <span className="date">{dataFormatada}</span>
                    <span className="time">{agendamento.hora}</span>
                  </div>
                  <div className="col-pet">
                    🐾 <strong>{agendamento.Pet?.nome}</strong>
                  </div>
                  <div className="col-tipo">
                    <span className="attendance-type">{agendamento.tipoAtendimento}</span>
                  </div>
                  <div className="col-cliente">
                    👤 {agendamento.Cliente?.nome}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
