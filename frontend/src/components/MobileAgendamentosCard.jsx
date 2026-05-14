import { useState } from 'react'
import axios from 'axios'
import MobileAgendamentoDetalhes from './MobileAgendamentoDetalhes'
import './MobileAgendamentosCard.css'

export default function MobileAgendamentosCard({ agendamento, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDetalhes, setShowDetalhes] = useState(false)

  // Mapeamento de emojis para tipos de pet (campo correto do backend: especie)
  const getPetEmoji = () => {
    const tipo = (agendamento.Pet?.especie || agendamento.Pet?.tipo || '').toLowerCase()
    if (tipo.includes('gato')) return '🐱'
    if (tipo.includes('cachorro') || tipo.includes('cão') || tipo.includes('cao')) return '🐕'
    if (tipo.includes('pássaro') || tipo.includes('ave') || tipo.includes('passaro')) return '🦜'
    if (tipo.includes('coelho')) return '🐰'
    if (tipo.includes('hamster')) return '🐹'
    if (tipo.includes('tartaruga')) return '🐢'
    return '🐾'
  }

  // Obter status visual
  const getStatusDisplay = () => {
    switch (agendamento.status) {
      case 'Pendente':
        return { label: 'Pendente', classe: 'status-pendente' }
      case 'Confirmado':
        return { label: 'Confirmado', classe: 'status-confirmado' }
      case 'Concluído':
        return { label: 'Concluído', classe: 'status-concluido' }
      case 'Cancelado':
        return { label: 'Cancelado', classe: 'status-cancelado' }
      default:
        return { label: agendamento.status, classe: 'status-default' }
    }
  }

  // Função para confirmar agendamento
  const handleConfirmar = async () => {
    if (!confirm('Deseja confirmar este agendamento?')) return

    try {
      setLoading(true)
      await axios.put(`/api/agendamentos/${agendamento.id}`, {
        status: 'Confirmado'
      })
      onStatusChange()
    } catch (err) {
      setError('Erro ao confirmar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para marcar como concluído
  const handleConcluir = async () => {
    if (!confirm('Deseja marcar este agendamento como concluído?')) return

    try {
      setLoading(true)
      await axios.put(`/api/agendamentos/${agendamento.id}`, {
        status: 'Concluído'
      })
      onStatusChange()
    } catch (err) {
      setError('Erro ao atualizar agendamento')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Função para ver histórico - navega para aba Histórico
  const handleHistorico = () => {
    // Dispara evento customizado para o Dashboard mudar de aba
    window.dispatchEvent(new CustomEvent('navegarPara', {
      detail: { tab: 'historico', petId: agendamento.Pet?.id }
    }))
  }

  const status = getStatusDisplay()
  const valor = parseFloat(agendamento.valor || 0)

  return (
    <>
      {showDetalhes && (
        <MobileAgendamentoDetalhes
          agendamentoId={agendamento.id}
          onClose={() => setShowDetalhes(false)}
          onSuccess={() => {
            setShowDetalhes(false)
            onStatusChange()
          }}
        />
      )}

      <div className={`mobile-agendamento-card ${status.classe}`}>
        {error && (
          <div className="card-error">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="card-header">
          <div className="card-horario">
            <span className="horario-icon">⏰</span>
            <span className="horario-texto">{agendamento.hora || agendamento.horario || '--:--'}</span>
          </div>
          <div className={`card-status ${status.classe}`}>
            {status.label}
          </div>
        </div>

        <div className="card-content">
          <div className="card-pet">
            <span className="pet-emoji">{getPetEmoji()}</span>
            <span className="pet-info">
              {agendamento.Pet?.nome || 'Pet'} - {agendamento.descricao || 'Consulta'}
            </span>
          </div>

          <div className="card-tutor">
            <span className="tutor-icon">👤</span>
            <span className="tutor-nome">{agendamento.Cliente?.nome || 'Cliente'}</span>
          </div>

          <div className="card-valor">
            <span className="valor-icon">💰</span>
            <span className="valor-texto">
              R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="card-actions">
          <button
            className="btn-acao btn-detalhes"
            onClick={() => setShowDetalhes(true)}
            disabled={loading}
          >
            📋 Ver Detalhes
          </button>

          {agendamento.status === 'Pendente' && (
            <>
              <button
                className="btn-acao btn-confirmar"
                onClick={handleConfirmar}
                disabled={loading}
              >
                ✓ Confirmar
              </button>
              <button
                className="btn-acao btn-historico"
                onClick={handleHistorico}
                disabled={loading}
              >
                📋 Histórico
              </button>
            </>
          )}

          {agendamento.status === 'Confirmado' && (
            <>
              <button
                className="btn-acao btn-concluir"
                onClick={handleConcluir}
                disabled={loading}
              >
                ✓ Finalizar
              </button>
              <button
                className="btn-acao btn-historico"
                onClick={handleHistorico}
                disabled={loading}
              >
                📋 Histórico
              </button>
            </>
          )}

          {agendamento.status === 'Concluído' && (
            <button
              className="btn-acao btn-editar"
              onClick={handleHistorico}
              disabled={loading}
            >
              📋 Histórico
            </button>
          )}
        </div>
      </div>
    </>
  )
}
